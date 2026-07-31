"""Measure the exported model, honestly.

Two suites, because they answer different questions:

1. **In-distribution** — the PlantVillage *test* split: same corpus the classifier was
   trained on, controlled lighting, plain background.
2. **Cross-dataset** — PlantDoc: leaves photographed in the field, different camera,
   different backgrounds, different labelling. This is the number that predicts what
   happens when a farmer points a phone at a plant.

Data comes from the Hugging Face parquet mirrors (no `datasets` install, no auth), images
are preprocessed exactly the way the web app does it, and inference runs through the same
ONNX graph the browser downloads. Results land in `benchmarks.json`, which the app reads —
the numbers on the site are never typed by hand.

    .venv/Scripts/python evaluate.py --images 200
"""

from __future__ import annotations

import argparse
import io
import json
import time
import urllib.parse
import urllib.request
from collections import Counter, defaultdict
from pathlib import Path

import numpy as np
import onnxruntime as ort
import pyarrow.parquet as pq
from PIL import Image

HERE = Path(__file__).resolve().parent
MODEL_DIR = HERE.parents[0] / "web" / "public" / "model"
CACHE = HERE / ".cache"
SIZE = 224
UA = {"User-Agent": "leafwise-eval/1.0"}

SUITES = [
    {
        "key": "in_distribution",
        "title": "PlantVillage · held-out test split",
        "dataset": "BrandonFors/Plant-Diseases-PlantVillage-Dataset",
        "split": "test",
        "kind": "In-distribution",
        "note": "Same corpus the classifier was trained on: single leaf, plain background, even light.",
    },
    {
        "key": "cross_dataset",
        "title": "PlantDoc · field photos",
        "dataset": "LamTNguyen/PlantDoc_processed",
        "split": "train",
        "kind": "Cross-dataset",
        "note": "Leaves photographed in the field by other people, with clutter and uneven light. Predicts real-world behaviour.",
    },
]


def parquet_files(dataset: str, split: str) -> list[str]:
    """Shard URLs from the auto-converted parquet branch (public, no auth, no rate limit).

    Smallest shard first: we only sample a couple of hundred images, so there is no reason
    to pull a 500 MB shard when a 150 MB one covers the same classes.
    """
    tree_url = (
        f"https://huggingface.co/api/datasets/{dataset}/tree/refs%2Fconvert%2Fparquet/"
        f"{urllib.parse.quote(f'default/{split}')}"
    )
    req = urllib.request.Request(tree_url, headers=UA)
    with urllib.request.urlopen(req, timeout=90) as r:
        entries = json.loads(r.read().decode())
    shards = sorted(
        ((e["path"], e.get("size", 0)) for e in entries if e["path"].endswith(".parquet")),
        key=lambda t: t[1],
    )
    return [
        f"https://huggingface.co/datasets/{dataset}/resolve/refs%2Fconvert%2Fparquet/{urllib.parse.quote(p)}"
        for p, _ in shards
    ]


def looks_like_parquet(path: Path) -> bool:
    if path.stat().st_size < 8:
        return False
    with path.open("rb") as f:
        head = f.read(4)
        f.seek(-4, 2)
        return head == b"PAR1" and f.read(4) == b"PAR1"


def fetch(url: str) -> Path:
    CACHE.mkdir(exist_ok=True)
    name = urllib.parse.quote(url, safe="")[-110:] + ".parquet"
    dest = CACHE / name
    if dest.exists() and looks_like_parquet(dest):
        return dest
    tmp = dest.with_suffix(".part")
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=600) as r, tmp.open("wb") as f:
        while chunk := r.read(1 << 20):
            f.write(chunk)
    tmp.replace(dest)
    if not looks_like_parquet(dest):
        raise RuntimeError(f"not a parquet file: {url}")
    return dest


def preprocess(img: Image.Image) -> np.ndarray:
    """Centre-crop to square then resize — identical to the browser path."""
    w, h = img.size
    side = min(w, h)
    img = img.crop(((w - side) // 2, (h - side) // 2, (w + side) // 2, (h + side) // 2))
    img = img.convert("RGB").resize((SIZE, SIZE), Image.BILINEAR)
    arr = np.asarray(img, dtype=np.float32).transpose(2, 0, 1)[None]
    return np.ascontiguousarray(arr)


def norm(text: str) -> str:
    return "".join(ch for ch in text.lower() if ch.isalnum())


# PlantDoc words -> the vocabulary the classifier was trained with.
SYNONYMS = {
    "leafmold": "leafmold",
    "mold": "leafmold",
    "twospottedspidermitesleaf": "spidermitesortwospottedspidermite",
    "spidermites": "spidermitesortwospottedspidermite",
    "yellowvirus": "yellowleafcurlvirus",
    "mosaicvirus": "mosaicvirus",
    "septorialeafspot": "septorialeafspot",
    "grayleafspot": "cercosporaandgrayleafspot",
    "leafblight": "northernleafblight",
    "rustleaf": "commonrust",
    "leafearlyblight": "earlyblight",
    "leaflateblight": "lateblight",
    "leafbacterialspot": "bacterialspot",
    "leafblack": "blackrot",
    "blackrot": "blackrot",
    "scableaf": "scab",
    "leafscorch": "leafscorch",
    "powderymildewleaf": "powderymildew",
}


def truth_keys(raw: str, crops: list[str], conditions: list[str]) -> tuple[str | None, str | None]:
    text = norm(raw)
    for word, replacement in SYNONYMS.items():
        if word in text:
            text = text.replace(word, replacement)
    crop = next((c for c in sorted(crops, key=len, reverse=True) if c and c in text), None)
    if "healthy" in text:
        return crop, "healthy"
    condition = next((c for c in sorted(conditions, key=len, reverse=True) if c and c in text), None)
    return crop, condition


def evaluate(suite: dict, sess: ort.InferenceSession, classes: list[dict], budget: int) -> dict:
    crops = sorted({norm(c["crop"]) for c in classes})
    conditions = sorted({norm(c["condition"]) for c in classes})
    class_keys = [(norm(c["crop"]), norm(c["condition"])) for c in classes]

    try:
        files = parquet_files(suite["dataset"], suite["split"])
    except Exception as exc:  # noqa: BLE001
        return {"key": suite["key"], "error": f"{type(exc).__name__}: {exc}"}

    seen = exact = top3 = crop_hits = crop_total = cond_hits = cond_total = skipped = 0
    latencies: list[float] = []
    per_crop_total: Counter[str] = Counter()
    per_crop_ok: Counter[str] = Counter()
    confusion: dict[str, Counter[str]] = defaultdict(Counter)
    unmatched: Counter[str] = Counter()

    for url in files:
        if seen >= budget:
            break
        path = fetch(url)
        table = pq.read_table(path)
        cols = table.column_names
        image_col = next((c for c in cols if c.lower() in {"image", "img", "picture"}), None)
        label_col = next((c for c in cols if c.lower() in {"label", "labels", "class"}), None)
        if image_col is None or label_col is None:
            return {"key": suite["key"], "error": f"unexpected columns: {cols}"}

        label_names = None
        meta = table.schema.metadata or {}
        if b"huggingface" in meta:
            try:
                info = json.loads(meta[b"huggingface"].decode())
                feature = info["info"]["features"][label_col]
                label_names = feature.get("names") or feature.get("_type") and feature.get("names")
            except (KeyError, json.JSONDecodeError):
                label_names = None

        rows = table.num_rows
        # even stride through the shard so we sample every class, not just the first ones
        step = max(1, rows // max(budget - seen, 1))
        for i in range(0, rows, step):
            if seen >= budget:
                break
            label_value = table[label_col][i].as_py()
            if isinstance(label_value, int):
                if not label_names:
                    skipped += 1
                    continue
                raw_label = label_names[label_value]
            else:
                raw_label = str(label_value)

            payload = table[image_col][i].as_py()
            data = payload.get("bytes") if isinstance(payload, dict) else payload
            if not data:
                skipped += 1
                continue
            try:
                img = Image.open(io.BytesIO(data))
            except OSError:
                skipped += 1
                continue

            t_crop, t_cond = truth_keys(raw_label, crops, conditions)
            if t_crop is None and t_cond is None:
                unmatched[raw_label] += 1
                skipped += 1
                continue

            tensor = preprocess(img)
            t0 = time.perf_counter()
            probs = sess.run(None, {"pixels": tensor})[0][0]
            latencies.append((time.perf_counter() - t0) * 1000)
            order = probs.argsort()[::-1][:3]
            seen += 1

            p_crop, p_cond = class_keys[int(order[0])]
            hit = (t_crop is None or p_crop == t_crop) and (t_cond is None or p_cond == t_cond)
            exact += int(hit)
            top3 += int(
                any(
                    (t_crop is None or class_keys[int(k)][0] == t_crop)
                    and (t_cond is None or class_keys[int(k)][1] == t_cond)
                    for k in order
                )
            )
            if t_crop:
                crop_total += 1
                ok = p_crop == t_crop
                crop_hits += int(ok)
                per_crop_total[t_crop] += 1
                per_crop_ok[t_crop] += int(ok)
            if t_cond:
                cond_total += 1
                cond_hits += int(p_cond == t_cond)
            if not hit:
                confusion[f"{t_crop or '?'}/{t_cond or '?'}"][f"{p_crop}/{p_cond}"] += 1

    if not seen:
        return {"key": suite["key"], "error": "no usable rows", "unmatched": unmatched.most_common(5)}

    worst = sorted(
        ((k, sum(v.values()), v.most_common(1)[0][0]) for k, v in confusion.items()),
        key=lambda t: -t[1],
    )[:4]

    return {
        "key": suite["key"],
        "title": suite["title"],
        "kind": suite["kind"],
        "dataset": suite["dataset"],
        "split": suite["split"],
        "note": suite["note"],
        "images": seen,
        "skipped": skipped,
        "exactTop1": round(100 * exact / seen, 1),
        "exactTop3": round(100 * top3 / seen, 1),
        "cropTop1": round(100 * crop_hits / crop_total, 1) if crop_total else None,
        "conditionTop1": round(100 * cond_hits / cond_total, 1) if cond_total else None,
        "latencyMeanMs": round(float(np.mean(latencies)), 1),
        "latencyP95Ms": round(float(np.percentile(latencies, 95)), 1),
        "perCrop": {
            k: round(100 * per_crop_ok[k] / v, 1) for k, v in per_crop_total.most_common(10) if v >= 4
        },
        "topConfusions": [{"truth": t, "count": n, "predicted": p} for t, n, p in worst],
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--images", type=int, default=200, help="images per suite")
    ap.add_argument("--only", action="append", choices=[s["key"] for s in SUITES], help="run one suite")
    ap.add_argument("--model", type=Path, default=MODEL_DIR / "leafwise.onnx")
    args = ap.parse_args()

    meta = json.loads((MODEL_DIR / "labels.json").read_text(encoding="utf-8"))
    opts = ort.SessionOptions()
    opts.intra_op_num_threads = 2
    sess = ort.InferenceSession(str(args.model), opts, providers=["CPUExecutionProvider"])

    # keep previous suites so a partial re-run does not wipe them
    previous: dict[str, dict] = {}
    existing = HERE / "benchmarks.json"
    if existing.exists():
        try:
            for suite in json.loads(existing.read_text(encoding="utf-8")).get("suites", []):
                previous[suite["key"]] = suite
        except json.JSONDecodeError:
            pass

    wanted = args.only or [s["key"] for s in SUITES]
    results = []
    for suite in SUITES:
        if suite["key"] not in wanted:
            if suite["key"] in previous:
                results.append(previous[suite["key"]])
                print(f"== {suite['title']}  (kept from previous run)")
            continue
        print(f"== {suite['title']}  ({suite['dataset']}:{suite['split']})")
        out = evaluate(suite, sess, meta["classes"], args.images)
        if out.get("error") and suite["key"] in previous and not previous[suite["key"]].get("error"):
            print(f"   failed ({out['error']}) — keeping the previous result")
            out = previous[suite["key"]]
        results.append(out)
        print("  ", json.dumps({k: v for k, v in out.items() if k not in {"perCrop", "topConfusions"}}))
        if out.get("perCrop"):
            print("   per crop:", json.dumps(out["perCrop"]))
        if out.get("topConfusions"):
            print("   confusions:", json.dumps(out["topConfusions"]))

    payload = {
        "model": meta["model"],
        "architecture": meta["architecture"],
        "classCount": meta["classCount"],
        "sizeMb": meta["sizeMb"],
        "host": "ONNX Runtime CPU, 2 threads, Intel i5-11400H",
        "generatedAt": time.strftime("%Y-%m-%d"),
        "suites": results,
    }
    for target in (HERE / "benchmarks.json", MODEL_DIR / "benchmarks.json"):
        target.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    print("wrote benchmarks.json")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
