"""Export the disease classifier to ONNX for on-device inference.

Takes a PlantVillage-finetuned MobileNetV2 from the Hugging Face Hub, exports it to ONNX
with a static 1x3x224x224 input, folds the image normalisation into the graph so the
browser only has to hand over raw RGB, then writes the label map the app ships with.

    .venv/Scripts/python export_model.py
    .venv/Scripts/python export_model.py --model <hf-id> --out ../web/public/model
"""

from __future__ import annotations

import argparse
import json
import shutil
from pathlib import Path

import numpy as np
import onnx
import onnxruntime as ort
import torch
import torch.nn as nn
from transformers import AutoImageProcessor, AutoModelForImageClassification

DEFAULT_MODEL = "linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification"
DEFAULT_OUT = Path(__file__).resolve().parents[1] / "web" / "public" / "model"
SIZE = 224


class Wrapped(nn.Module):
    """Normalisation + backbone + softmax as a single graph.

    Keeping preprocessing inside the ONNX graph means the browser passes plain
    0-255 RGB and cannot silently disagree with the training pipeline about mean/std —
    the classic cause of "works in Python, garbage in the app".
    """

    def __init__(self, model: nn.Module, mean: list[float], std: list[float]) -> None:
        super().__init__()
        self.model = model
        self.register_buffer("mean", torch.tensor(mean).view(1, 3, 1, 1) * 255.0)
        self.register_buffer("std", torch.tensor(std).view(1, 3, 1, 1) * 255.0)

    def forward(self, pixels_rgb_255: torch.Tensor) -> torch.Tensor:
        x = (pixels_rgb_255 - self.mean) / self.std
        logits = self.model(pixel_values=x).logits
        return torch.softmax(logits, dim=-1)


# The checkpoint's labels are prose ("Corn (Maize) with Common Rust"), so crop and
# condition are split explicitly rather than guessed. Explicit beats clever: these strings
# drive the guidance lookup in the app, and a silent mis-split would show wrong advice.
CROP_HINTS = (
    "Bell Pepper",
    "Corn (Maize)",
    "Apple",
    "Blueberry",
    "Cherry",
    "Grape",
    "Orange",
    "Peach",
    "Potato",
    "Raspberry",
    "Soybean",
    "Squash",
    "Strawberry",
    "Tomato",
)


def prettify(raw: str) -> dict:
    text = raw.strip()
    healthy = text.lower().startswith("healthy")

    crop = next((c for c in CROP_HINTS if c.lower() in text.lower()), None)
    if crop is None:  # e.g. "Cedar Apple Rust"
        crop = "Apple" if "apple" in text.lower() else text.split()[0]

    if healthy:
        condition = "Healthy"
    elif " with " in text:
        condition = text.split(" with ", 1)[1].strip()
    else:
        # "Apple Scab", "Cedar Apple Rust", "Tomato Mosaic Virus"
        condition = text.replace(crop, "").strip() or text
    condition = condition[0].upper() + condition[1:] if condition else "Unknown"

    return {
        "raw": raw,
        "crop": crop,
        "condition": condition,
        "healthy": healthy,
        "label": f"{crop} · {condition}",
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--model", default=DEFAULT_MODEL)
    ap.add_argument("--out", type=Path, default=DEFAULT_OUT)
    args = ap.parse_args()
    args.out.mkdir(parents=True, exist_ok=True)

    print(f"loading {args.model}")
    processor = AutoImageProcessor.from_pretrained(args.model)
    model = AutoModelForImageClassification.from_pretrained(args.model).eval()

    mean = list(getattr(processor, "image_mean", [0.5, 0.5, 0.5]))
    std = list(getattr(processor, "image_std", [0.5, 0.5, 0.5]))
    print(f"  normalisation folded in: mean={mean} std={std}")

    id2label = model.config.id2label
    labels = [id2label[i] for i in range(len(id2label))]
    print(f"  {len(labels)} classes")

    wrapped = Wrapped(model, mean, std).eval()
    dummy = torch.randint(0, 255, (1, 3, SIZE, SIZE), dtype=torch.float32)

    onnx_path = args.out / "leafwise.onnx"
    torch.onnx.export(
        wrapped,
        dummy,
        str(onnx_path),
        input_names=["pixels"],
        output_names=["probabilities"],
        opset_version=17,
        do_constant_folding=True,
        dynamic_axes=None,
    )
    onnx.checker.check_model(onnx.load(str(onnx_path)))
    size_mb = onnx_path.stat().st_size / 1e6
    print(f"  wrote {onnx_path.name} ({size_mb:.2f} MB)")

    # parity check: torch vs onnxruntime on the same tensor
    with torch.no_grad():
        torch_out = wrapped(dummy).numpy()
    sess = ort.InferenceSession(str(onnx_path), providers=["CPUExecutionProvider"])
    onnx_out = sess.run(None, {"pixels": dummy.numpy()})[0]
    drift = float(np.abs(torch_out - onnx_out).max())
    print(f"  torch/onnx max probability drift: {drift:.2e}")
    if drift > 1e-4:
        print("  !! drift is larger than expected")

    classes = [prettify(name) for name in labels]
    crops = sorted({c["crop"] for c in classes})
    meta = {
        "model": args.model,
        "architecture": "MobileNetV2 1.0 224",
        "inputSize": SIZE,
        "inputLayout": "NCHW float32 RGB 0-255 (normalisation folded into the graph)",
        "output": "softmax probabilities",
        "classCount": len(classes),
        "crops": crops,
        "sizeMb": round(size_mb, 2),
        "onnxDrift": drift,
        "classes": classes,
    }
    (args.out / "labels.json").write_text(json.dumps(meta, indent=2) + "\n", encoding="utf-8")
    print(f"  wrote labels.json ({len(crops)} crops)")

    shutil.copy(args.out / "labels.json", Path(__file__).resolve().parent / "labels.json")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
