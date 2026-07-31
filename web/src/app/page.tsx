import Link from "next/link";

import benchmarks from "../../public/model/benchmarks.json";
import labels from "../../public/model/labels.json";
import { LeafMark, Stat } from "@/components/ui";
import type { Benchmarks, ModelMeta } from "@/lib/types";

const REPO = "https://github.com/shahriar-ahmed-seam/leafwise";
const bench = benchmarks as Benchmarks;
const meta = labels as ModelMeta;

// A suite that failed to run is dropped rather than rendered as blanks.
const usable = bench.suites.filter((s) => typeof s.exactTop1 === "number");
const inDist = usable.find((s) => s.key === "in_distribution");
const cross = usable.find((s) => s.key === "cross_dataset");

const STEPS = [
  {
    n: "01",
    title: "Capture",
    body: "The camera frame is centre-cropped to a square and resized to 224 px on a canvas. No image ever leaves the tab.",
  },
  {
    n: "02",
    title: "Infer",
    body: `A ${meta.sizeMb} MB MobileNetV2 graph runs on ONNX Runtime Web (single-threaded WASM SIMD). Normalisation is baked into the graph, so the browser and the training pipeline cannot disagree.`,
  },
  {
    n: "03",
    title: "Explain",
    body: "The top three classes come back with probabilities, and each condition maps to field notes: how to confirm it by eye, what to do today, how it spreads.",
  },
  {
    n: "04",
    title: "Keep",
    body: "Scans are written to IndexedDB with a thumbnail and exportable as CSV. The service worker caches the shell and the model, so the second visit needs no network at all.",
  },
];

const LIMITS = [
  `Fourteen crops, ${meta.classCount} classes. Anything else still returns a confident-looking answer — that is how softmax works. The app flags anything under 45% as unknown rather than hiding it.`,
  "Trained on PlantVillage: single leaves on plain backgrounds. Field photos with clutter and mixed lighting are measurably harder, which is exactly why the cross-dataset number is published above.",
  "One leaf per photo. Whole-plant shots and multiple leaves in frame dilute the prediction.",
  "It is a classifier, not an agronomist. The guidance names no pesticide or dose — product choice depends on local regulation and crop stage.",
];

const STACK = [
  { label: "Model", value: `MobileNetV2 1.0 224 · ${meta.classCount} classes · ${meta.sizeMb} MB ONNX` },
  { label: "Runtime", value: "ONNX Runtime Web, WASM SIMD, single thread" },
  { label: "App", value: "Next.js 15 · TypeScript · Tailwind · static export" },
  { label: "Storage", value: "IndexedDB for history · Cache API for model and shell" },
  { label: "Toolchain", value: "PyTorch export, ONNX checker, parity test, parquet-based eval" },
  { label: "Delivery", value: "GitHub Actions · Vercel · installable PWA" },
];

export default function LandingPage() {
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-bone-200 bg-bone-50/90 backdrop-blur">
        <nav className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4">
          <Link href="/" className="flex items-center gap-2">
            <LeafMark />
            <span className="text-[15px] font-semibold tracking-tight">Leafwise</span>
          </Link>
          <div className="ml-auto hidden items-center gap-6 text-[12.5px] text-ink-500 md:flex">
            <a href="#how" className="hover:text-ink-900">
              How it works
            </a>
            <a href="#accuracy" className="hover:text-ink-900">
              Accuracy
            </a>
            <a href="#limits" className="hover:text-ink-900">
              Limits
            </a>
            <a href={REPO} target="_blank" rel="noreferrer" className="hover:text-ink-900">
              Source
            </a>
          </div>
          <Link href="/scan" className="btn btn-primary ml-auto md:ml-0">
            Open scanner
          </Link>
        </nav>
      </header>

      <main id="main">
        {/* hero */}
        <section className="mx-auto max-w-6xl px-4 pb-14 pt-14 sm:pt-20">
          <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_400px]">
            <div className="animate-fade-up">
              <span className="pill border-leaf-300 bg-leaf-100 text-leaf-700">
                <span className="h-1.5 w-1.5 rounded-full bg-leaf-600" />
                Runs with the network off
              </span>
              <h1 className="mt-5 text-[38px] font-semibold leading-[1.05] tracking-tight sm:text-[52px]">
                Diagnose a leaf
                <span className="block text-leaf-700">without a signal.</span>
              </h1>
              <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-ink-700">
                Leafwise puts a {meta.sizeMb} MB disease classifier inside the browser. {meta.classCount} classes
                across {meta.crops.length} crops, about {cross?.latencyMeanMs ?? 40} ms per scan, no upload, no
                account, no server — because the places that need this most are the places with the worst
                connectivity.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/scan" className="btn btn-primary px-5 py-3 text-[14px]">
                  Scan a leaf
                </Link>
                <a href={REPO} target="_blank" rel="noreferrer" className="btn px-5 py-3 text-[14px]">
                  Read the source
                </a>
              </div>
              <ul className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-[12px] text-ink-300">
                <li>Installable</li>
                <li>No photo leaves the device</li>
                <li>Accuracy measured on two datasets</li>
                <li>MIT licensed</li>
              </ul>
            </div>

            <div className="animate-fade-up">
              <div className="card overflow-hidden">
                <div className="flex items-center gap-2 border-b border-bone-200 px-4 py-2.5">
                  <span className="h-2 w-2 rounded-full bg-leaf-500" />
                  <span className="num text-[11px] text-ink-300">on-device · offline capable</span>
                </div>
                <div className="space-y-3 p-4">
                  <div className="rounded-xl border border-bone-200 bg-bone-100 p-3">
                    <div className="label">Detected</div>
                    <div className="mt-1 text-[17px] font-semibold">Tomato · Late Blight</div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-bone-200">
                      <div className="h-full w-[94%] rounded-full bg-clay-600" />
                    </div>
                    <div className="num mt-1.5 flex justify-between text-[11px] text-ink-500">
                      <span>94.1% confidence</span>
                      <span>{cross?.latencyMeanMs ?? 40} ms</span>
                    </div>
                  </div>
                  <div className="rounded-xl border border-clay-500/30 bg-clay-100 p-3 text-[12.5px] leading-relaxed text-clay-700">
                    <strong className="font-semibold">Act today.</strong> Can take a crop in under a week in cool
                    wet weather. Bag affected leaves, stop overhead watering, re-check in 48 hours.
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    {[
                      ["Model", `${meta.sizeMb} MB`],
                      ["Classes", String(meta.classCount)],
                      ["Crops", String(meta.crops.length)],
                    ].map(([k, v]) => (
                      <div key={k} className="rounded-xl border border-bone-200 p-2">
                        <div className="label">{k}</div>
                        <div className="num mt-0.5 text-[14px] font-semibold">{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <p className="mt-2.5 text-[11px] text-ink-300">
                Illustration of a real result. Open the scanner for live inference on your own photo.
              </p>
            </div>
          </div>
        </section>

        {/* numbers */}
        <section id="accuracy" className="border-y border-bone-200 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-12">
            <div className="max-w-2xl">
              <span className="label text-leaf-700">Measured</span>
              <h2 className="mt-2.5 text-[26px] font-semibold tracking-tight sm:text-[32px]">
                Two accuracy numbers, because one would be misleading
              </h2>
              <p className="mt-3 text-[13.5px] leading-relaxed text-ink-500">
                Almost every plant-disease demo quotes 99% and stops there. That figure comes from PlantVillage,
                where each leaf is photographed alone on a plain background. The number that matters is what
                happens on a photo taken in a field — so both are measured and published, on{" "}
                {inDist?.images ?? 0} and {cross?.images ?? 0} images respectively.
              </p>
              {inDist?.exactTop1 && cross?.exactTop1 ? (
                <p className="mt-3 rounded-2xl border border-clay-500/30 bg-clay-100 p-4 text-[13px] leading-relaxed text-clay-700">
                  <strong className="font-semibold">
                    {inDist.exactTop1}% becomes {cross.exactTop1}%.
                  </strong>{" "}
                  Same model, same code — the only change is that the leaves were photographed in a field
                  instead of on a bench. It still names the right crop {cross.cropTop1}% of the time, and the
                  mistakes are systematic rather than random. That is why this app flags low confidence and shows
                  you the runner-up instead of pretending to be certain.
                </p>
              ) : null}
            </div>

            <div className="mt-8 grid gap-4 lg:grid-cols-2">
              {[inDist, cross].map((suite) =>
                suite ? (
                  <div key={suite.key} className="card p-5">
                    <div className="flex items-baseline justify-between gap-3">
                      <div>
                        <div className="label">{suite.kind}</div>
                        <h3 className="mt-1 text-[15px] font-semibold">{suite.title}</h3>
                      </div>
                      <span className="num text-[11px] text-ink-300">{suite.images} images</span>
                    </div>
                    <p className="mt-2 text-[12px] leading-relaxed text-ink-500">{suite.note}</p>
                    <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                      <Stat
                        label="Top-1"
                        value={suite.exactTop1 ?? "—"}
                        unit="%"
                        tone={suite.key === "cross_dataset" ? "text-clay-600" : "text-leaf-700"}
                      />
                      <Stat label="Top-3" value={suite.exactTop3 ?? "—"} unit="%" />
                      <Stat label="Crop only" value={suite.cropTop1 ?? "—"} unit="%" />
                      <Stat label="Latency" value={suite.latencyMeanMs ?? "—"} unit="ms" />
                    </dl>
                    {suite.perCrop && Object.keys(suite.perCrop).length ? (
                      <div className="mt-4 border-t border-bone-200 pt-3">
                        <div className="label mb-2">Crop identification by crop</div>
                        <div className="space-y-1.5">
                          {Object.entries(suite.perCrop)
                            .slice(0, 6)
                            .map(([crop, pct]) => (
                              <div key={crop} className="flex items-center gap-2 text-[11.5px]">
                                <span className="w-24 shrink-0 truncate capitalize text-ink-700">{crop}</span>
                                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-bone-200">
                                  <span
                                    className="block h-full rounded-full bg-leaf-500"
                                    style={{ width: `${pct}%` }}
                                  />
                                </span>
                                <span className="num w-10 shrink-0 text-right text-ink-500">{pct}%</span>
                              </div>
                            ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null,
              )}
            </div>
            <p className="mt-4 text-[11.5px] leading-relaxed text-ink-300">
              {bench.host} · generated {bench.generatedAt} by <code className="num">tools/evaluate.py</code>, which
              writes the JSON this page renders — nothing here is typed by hand. The sampled PlantDoc shard is
              tomato-dominated, so read the cross-dataset row as a tomato-weighted estimate rather than a balanced
              38-class score.
            </p>
          </div>
        </section>

        {/* how */}
        <section id="how" className="mx-auto max-w-6xl px-4 py-14">
          <div className="max-w-2xl">
            <span className="label text-leaf-700">Pipeline</span>
            <h2 className="mt-2.5 text-[26px] font-semibold tracking-tight sm:text-[32px]">
              Four steps, all of them local
            </h2>
          </div>
          <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step) => (
              <li key={step.n} className="card p-5">
                <div className="num text-[11px] text-leaf-600">{step.n}</div>
                <h3 className="mt-2 text-[14.5px] font-semibold">{step.title}</h3>
                <p className="mt-2 text-[12.5px] leading-relaxed text-ink-500">{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* coverage */}
        <section className="border-y border-bone-200 bg-white py-14">
          <div className="mx-auto max-w-6xl px-4">
            <div className="max-w-2xl">
              <span className="label text-leaf-700">Coverage</span>
              <h2 className="mt-2.5 text-[26px] font-semibold tracking-tight sm:text-[32px]">
                {meta.crops.length} crops, {meta.classCount} classes
              </h2>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              {meta.crops.map((crop) => (
                <span key={crop} className="pill text-[12px]">
                  {crop}
                </span>
              ))}
            </div>
            <div className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {meta.classes
                .filter((c) => !c.healthy)
                .slice(0, 12)
                .map((c) => (
                  <div key={c.raw} className="rounded-xl border border-bone-200 px-3 py-2 text-[12.5px]">
                    <span className="text-ink-900">{c.crop}</span>
                    <span className="text-ink-300"> · </span>
                    <span className="text-clay-600">{c.condition}</span>
                  </div>
                ))}
            </div>
            <p className="mt-4 text-[12px] text-ink-300">
              …and {meta.classes.filter((c) => !c.healthy).length - 12} more disease classes, plus healthy
              references for {meta.classes.filter((c) => c.healthy).length} crops.
            </p>
          </div>
        </section>

        {/* limits */}
        <section id="limits" className="mx-auto max-w-4xl px-4 py-14">
          <div className="max-w-2xl">
            <span className="label text-clay-600">Limits</span>
            <h2 className="mt-2.5 text-[26px] font-semibold tracking-tight sm:text-[32px]">
              What it cannot do
            </h2>
            <p className="mt-3 text-[13.5px] leading-relaxed text-ink-500">
              A tool that decides whether someone sprays their field should be honest about its edges.
            </p>
          </div>
          <ul className="mt-7 space-y-3">
            {LIMITS.map((limit) => (
              <li key={limit} className="flex gap-3 rounded-2xl border border-bone-200 bg-white p-4">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-clay-500" />
                <p className="text-[12.5px] leading-relaxed text-ink-700">{limit}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* stack */}
        <section className="border-t border-bone-200 bg-white py-14">
          <div className="mx-auto max-w-6xl px-4">
            <div className="max-w-2xl">
              <span className="label text-leaf-700">Stack</span>
              <h2 className="mt-2.5 text-[26px] font-semibold tracking-tight sm:text-[32px]">
                No server to keep alive
              </h2>
            </div>
            <dl className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-bone-200 bg-bone-200 sm:grid-cols-2">
              {STACK.map((row) => (
                <div key={row.label} className="bg-white p-5">
                  <dt className="label">{row.label}</dt>
                  <dd className="mt-1.5 text-[13px] text-ink-700">{row.value}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-8 card flex flex-wrap items-center gap-4 p-6">
              <div className="min-w-0 flex-1">
                <h3 className="text-[17px] font-semibold tracking-tight">Install it and turn off your data</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-ink-500">
                  Open the scanner once so the model caches, then add it to your home screen. It keeps working in a
                  field with no bars.
                </p>
              </div>
              <Link href="/scan" className="btn btn-primary px-5 py-3 text-[14px]">
                Open scanner
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-bone-200 px-4 py-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 text-[11.5px] text-ink-300 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <LeafMark className="h-5 w-5" />
            <span>Leafwise — built by Shahriar Ahmed Seam · Somokolon Labs</span>
          </div>
          <p className="sm:ml-auto sm:text-right">
            Classifier fine-tuned on PlantVillage; evaluation uses PlantDoc. General horticultural guidance only —
            confirm with a local extension service before treating.
          </p>
        </div>
      </footer>
    </div>
  );
}
