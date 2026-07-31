"use client";

import clsx from "clsx";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { classify, getMeta, isReady, loadModel, type LoadState } from "@/lib/classifier";
import { SEVERITY_META, guidanceFor } from "@/lib/guidance";
import { clearHistory, exportCsv, loadHistory, pushHistory } from "@/lib/history";
import type { ScanResult } from "@/lib/types";

import { Bar, Card, CardHead, LeafMark, OfflineBadge } from "./ui";

type Mode = "camera" | "upload";

const CONFIDENCE_FLOOR = 0.45;

export default function ScanConsole() {
  const [load, setLoad] = useState<LoadState>({ stage: "idle", receivedBytes: 0, totalBytes: 0 });
  const [mode, setMode] = useState<Mode>("camera");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [history, setHistory] = useState<ScanResult[]>([]);
  const [online, setOnline] = useState(true);
  const [selected, setSelected] = useState(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // --- model + history + connectivity ---------------------------------------
  useEffect(() => {
    void loadModel(setLoad).catch(() => undefined);
    void loadHistory().then(setHistory);
    const sync = () => setOnline(navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch {
      setCameraError("Camera unavailable — grant permission, or switch to a photo upload.");
    }
  }, []);

  useEffect(() => {
    if (mode === "camera") void startCamera();
    else stopCamera();
    return stopCamera;
  }, [mode, startCamera, stopCamera]);

  // --- inference ------------------------------------------------------------
  const run = useCallback(
    async (source: CanvasImageSource, width: number, height: number, origin: ScanResult["source"]) => {
      if (!isReady()) return;
      setBusy(true);
      try {
        const out = await classify(source, width, height, 3);
        const entry: ScanResult = {
          id: crypto.randomUUID(),
          at: Date.now(),
          predictions: out.predictions,
          latencyMs: out.latencyMs,
          preprocessMs: out.preprocessMs,
          thumbnail: out.thumbnail,
          source: origin,
        };
        setResult(entry);
        setSelected(0);
        setHistory(await pushHistory(entry));
      } finally {
        setBusy(false);
      }
    },
    [],
  );

  const capture = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    void run(video, video.videoWidth, video.videoHeight, "camera");
  }, [run]);

  const onFile = useCallback(
    (file: File) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        void run(img, img.naturalWidth, img.naturalHeight, "upload").finally(() =>
          URL.revokeObjectURL(url),
        );
      };
      img.src = url;
    },
    [run],
  );

  const meta = getMeta();
  const top = result?.predictions[selected];
  const guidance = top ? guidanceFor(top.entry.condition, top.entry.healthy) : null;
  const severity = guidance ? SEVERITY_META[guidance.severity] : null;
  const lowConfidence = !!top && top.probability < CONFIDENCE_FLOOR;
  const progress =
    load.totalBytes > 0 ? Math.round((load.receivedBytes / load.totalBytes) * 100) : load.stage === "ready" ? 100 : 0;

  return (
    <div className="min-h-dvh bg-bone-50">
      <header className="sticky top-0 z-30 border-b border-bone-200 bg-bone-50/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
          <Link href="/" className="flex items-center gap-2">
            <LeafMark />
            <span className="text-[15px] font-semibold tracking-tight">Leafwise</span>
          </Link>
          <span className="hidden text-[11.5px] text-ink-300 sm:block">scanner</span>
          <div className="ml-auto flex items-center gap-2">
            <OfflineBadge online={online} />
            <span className="pill" title="Inference happens in this browser tab. No image is uploaded.">
              <span className="h-1.5 w-1.5 rounded-full bg-leaf-500" />
              On-device
            </span>
          </div>
        </div>
      </header>

      {load.stage !== "ready" ? (
        <div className="border-b border-bone-200 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-3">
            <div className="flex items-center justify-between text-[12.5px] text-ink-700">
              <span>
                {load.stage === "error"
                  ? `Model failed to load: ${load.message}`
                  : load.stage === "compiling"
                    ? "Preparing the model…"
                    : "Downloading the model once — after this the app works offline"}
              </span>
              <span className="num text-ink-300">
                {(load.receivedBytes / 1e6).toFixed(1)} / {(load.totalBytes / 1e6 || 9.3).toFixed(1)} MB
              </span>
            </div>
            <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-bone-200">
              <div
                className={clsx("h-full rounded-full transition-[width]", load.stage === "error" ? "bg-clay-600" : "bg-leaf-500")}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      ) : null}

      <main id="main" className="mx-auto grid max-w-6xl gap-4 px-4 py-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        {/* capture */}
        <section className="space-y-4">
          <Card className="overflow-hidden">
            <div className="flex items-center gap-2 border-b border-bone-200 px-3 py-2">
              <div className="flex gap-1 rounded-xl border border-bone-200 bg-bone-50 p-1">
                {(["camera", "upload"] as Mode[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    aria-pressed={mode === m}
                    className={clsx(
                      "rounded-lg px-3 py-1.5 text-[12.5px] font-medium transition",
                      mode === m ? "bg-white text-ink-900 shadow-card" : "text-ink-500 hover:text-ink-900",
                    )}
                  >
                    {m === "camera" ? "Camera" : "Photo"}
                  </button>
                ))}
              </div>
              <span className="ml-auto num text-[11px] text-ink-300">
                {meta ? `${meta.classCount} classes · ${meta.crops.length} crops · ${meta.sizeMb} MB` : "loading…"}
              </span>
            </div>

            <div className="relative aspect-[4/3] w-full overflow-hidden bg-ink-900">
              {mode === "camera" ? (
                <>
                  <video
                    ref={videoRef}
                    playsInline
                    muted
                    className="h-full w-full object-cover"
                    aria-label="Camera preview"
                  />
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="relative aspect-square h-[76%] rounded-2xl border-2 border-white/70 shadow-[0_0_0_9999px_rgba(20,24,26,0.32)]">
                      <div className="absolute inset-x-0 top-0 h-[2px] animate-scan-line bg-leaf-300/90" />
                      <span className="absolute -bottom-7 left-0 right-0 text-center text-[11.5px] text-white/80">
                        Fill the square with one leaf
                      </span>
                    </div>
                  </div>
                  {cameraError ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-ink-900/85 p-6 text-center text-[13px] text-white/85">
                      {cameraError}
                    </div>
                  ) : null}
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex h-full w-full flex-col items-center justify-center gap-2 text-white/70 transition hover:text-white"
                >
                  {result?.thumbnail && result.source === "upload" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={result.thumbnail} alt="Uploaded leaf" className="h-full w-full object-contain" />
                  ) : (
                    <>
                      <span className="text-[15px] font-medium">Choose a leaf photo</span>
                      <span className="text-[12px] text-white/50">Nothing is uploaded — it is read locally</span>
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 border-t border-bone-200 p-3">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onFile(file);
                }}
              />
              {mode === "camera" ? (
                <button
                  type="button"
                  className="btn btn-primary flex-1"
                  onClick={capture}
                  disabled={busy || load.stage !== "ready"}
                >
                  {busy ? "Analysing…" : "Scan this leaf"}
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-primary flex-1"
                  onClick={() => fileRef.current?.click()}
                  disabled={busy || load.stage !== "ready"}
                >
                  {busy ? "Analysing…" : "Choose photo"}
                </button>
              )}
              {result ? (
                <span className="num shrink-0 rounded-lg border border-bone-200 bg-bone-50 px-2.5 py-2 text-[11.5px] text-ink-500">
                  {result.latencyMs.toFixed(0)} ms inference · {result.preprocessMs.toFixed(0)} ms prep
                </span>
              ) : null}
            </div>
          </Card>

          {/* result */}
          {result && top && guidance && severity ? (
            <Card className="animate-fade-up overflow-hidden">
              <div className="flex flex-wrap items-start gap-4 p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={result.thumbnail}
                  alt="Scanned leaf"
                  className="h-24 w-24 shrink-0 rounded-xl border border-bone-200 object-cover"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={clsx("rounded-full border px-2.5 py-1 text-[11px] font-semibold", severity.tone)}>
                      {severity.label}
                    </span>
                    {lowConfidence ? (
                      <span className="pill border-sun-500/40 bg-sun-100 text-sun-600">Low confidence</span>
                    ) : null}
                  </div>
                  <h2 className="mt-2 text-[20px] font-semibold leading-tight tracking-tight">
                    {top.entry.crop} · {top.entry.condition}
                  </h2>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-ink-700">{guidance.summary}</p>
                </div>
              </div>

              <div className="grid gap-px bg-bone-200 sm:grid-cols-2">
                <div className="bg-white p-4">
                  <div className="label">Confirm by eye</div>
                  <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-700">{guidance.confirm}</p>
                  <div className="label mt-3">How it spreads</div>
                  <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-700">{guidance.spread}</p>
                </div>
                <div className="bg-white p-4">
                  <div className="label">Do now</div>
                  <ul className="mt-1.5 space-y-1.5">
                    {guidance.now.map((step) => (
                      <li key={step} className="flex gap-2 text-[12.5px] leading-relaxed text-ink-700">
                        <span className={clsx("mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full", severity.ring)} />
                        {step}
                      </li>
                    ))}
                  </ul>
                  <div className="label mt-3">Next season</div>
                  <ul className="mt-1.5 space-y-1">
                    {guidance.prevent.map((step) => (
                      <li key={step} className="flex gap-2 text-[12.5px] leading-relaxed text-ink-500">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-bone-300" />
                        {step}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="border-t border-bone-200 p-4">
                <div className="label mb-2">Top 3 · tap to compare</div>
                <div className="space-y-2">
                  {result.predictions.map((p, i) => (
                    <button
                      key={p.index}
                      type="button"
                      onClick={() => setSelected(i)}
                      className={clsx(
                        "w-full rounded-xl border px-3 py-2 text-left transition",
                        i === selected ? "border-leaf-500 bg-leaf-100/60" : "border-bone-200 hover:border-ink-300",
                      )}
                    >
                      <span className="flex items-baseline justify-between gap-2 text-[12.5px]">
                        <span className="truncate font-medium text-ink-900">
                          {p.entry.crop} · {p.entry.condition}
                        </span>
                        <span className="num shrink-0 text-ink-500">{(p.probability * 100).toFixed(1)}%</span>
                      </span>
                      <span className="mt-1.5 block">
                        <Bar
                          value={p.probability * 100}
                          tone={p.entry.healthy ? "bg-leaf-500" : i === 0 ? "bg-clay-500" : "bg-bone-300"}
                        />
                      </span>
                    </button>
                  ))}
                </div>
                {lowConfidence ? (
                  <p className="mt-3 rounded-xl border border-sun-500/30 bg-sun-100 p-3 text-[12px] leading-relaxed text-sun-600">
                    The top score is below {Math.round(CONFIDENCE_FLOOR * 100)}%, which usually means the leaf is not
                    filling the frame, the crop is outside the 14 it knows, or the lighting is poor. Re-shoot closer
                    before acting on this.
                  </p>
                ) : null}
              </div>
            </Card>
          ) : (
            <Card className="p-5 text-[13px] leading-relaxed text-ink-500">
              Point the camera at a single leaf, filling the square, and press scan. The model runs in this tab —
              once it has loaded you can turn off mobile data entirely.
            </Card>
          )}
        </section>

        {/* side */}
        <aside className="space-y-4">
          <Card>
            <CardHead
              title="History"
              hint="Stored on this device only"
              right={
                history.length ? (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="text-[11.5px] text-ink-300 hover:text-ink-900"
                      onClick={() => {
                        const blob = new Blob([exportCsv(history)], { type: "text/csv" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `leafwise-scans-${new Date().toISOString().slice(0, 10)}.csv`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                    >
                      CSV
                    </button>
                    <button
                      type="button"
                      className="text-[11.5px] text-ink-300 hover:text-clay-600"
                      onClick={() => {
                        void clearHistory().then(() => setHistory([]));
                      }}
                    >
                      Clear
                    </button>
                  </div>
                ) : null
              }
            />
            <ul className="divide-y divide-bone-200">
              {history.length === 0 ? (
                <li className="px-4 py-4 text-[12.5px] text-ink-300">No scans yet.</li>
              ) : (
                history.slice(0, 8).map((entry) => {
                  const first = entry.predictions[0];
                  return (
                    <li key={entry.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setResult(entry);
                          setSelected(0);
                        }}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition hover:bg-bone-50"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={entry.thumbnail}
                          alt=""
                          className="h-10 w-10 shrink-0 rounded-lg border border-bone-200 object-cover"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[12.5px] font-medium text-ink-900">
                            {first?.entry.crop} · {first?.entry.condition}
                          </span>
                          <span className="num block text-[10.5px] text-ink-300">
                            {new Date(entry.at).toLocaleString()} · {((first?.probability ?? 0) * 100).toFixed(0)}%
                          </span>
                        </span>
                        <span
                          className={clsx(
                            "h-2 w-2 shrink-0 rounded-full",
                            first?.entry.healthy ? "bg-leaf-500" : "bg-clay-500",
                          )}
                        />
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          </Card>

          <Card>
            <CardHead title="Coverage" hint="What this model can and cannot see" />
            <div className="p-4">
              <div className="flex flex-wrap gap-1.5">
                {(meta?.crops ?? []).map((crop) => (
                  <span key={crop} className="pill">
                    {crop}
                  </span>
                ))}
              </div>
              <p className="mt-3 text-[12px] leading-relaxed text-ink-500">
                Anything outside these 14 crops will still return a confident-looking answer — that is how
                classifiers behave. Treat a result under {Math.round(CONFIDENCE_FLOOR * 100)}% as &ldquo;unknown&rdquo;,
                and check the second guess before spending money.
              </p>
              <Link href="/#accuracy" className="mt-3 inline-block text-[12px] font-medium text-leaf-700 hover:underline">
                See measured accuracy →
              </Link>
            </div>
          </Card>

          <Card>
            <CardHead title="Privacy" hint="Why there is no upload button" />
            <p className="p-4 text-[12px] leading-relaxed text-ink-500">
              Photos are decoded into a tensor in this tab and discarded. The only thing that persists is the
              thumbnail in your own history, in IndexedDB on this device. There is no server to send anything to —
              the app is a static bundle plus a {meta?.sizeMb ?? 9.3} MB model file.
            </p>
          </Card>
        </aside>
      </main>
    </div>
  );
}
