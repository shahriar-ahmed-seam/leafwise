"use client";

/**
 * On-device classifier.
 *
 * The whole point of Leafwise is that this file is the entire backend: the ONNX graph is
 * fetched once, cached by the service worker, and every scan afterwards runs in the
 * browser with no network. Normalisation lives inside the graph (see tools/export_model.py),
 * so all we hand over is raw RGB in 0-255 — there is no second copy of the preprocessing
 * constants to drift out of sync.
 */

import type { InferenceSession, Tensor } from "onnxruntime-web";

import type { ModelMeta, Prediction } from "./types";

const MODEL_URL = "/model/leafwise.onnx";
const LABELS_URL = "/model/labels.json";
const SIZE = 224;

export type LoadStage = "idle" | "fetching" | "compiling" | "ready" | "error";

export interface LoadState {
  stage: LoadStage;
  receivedBytes: number;
  totalBytes: number;
  message?: string;
}

let session: InferenceSession | null = null;
let meta: ModelMeta | null = null;
let loading: Promise<void> | null = null;
let ortModule: typeof import("onnxruntime-web") | null = null;

export function getMeta(): ModelMeta | null {
  return meta;
}

export function isReady(): boolean {
  return session !== null && meta !== null;
}

async function fetchWithProgress(url: string, onProgress: (received: number, total: number) => void) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  const total = Number(res.headers.get("content-length") ?? 0);
  if (!res.body) return new Uint8Array(await res.arrayBuffer());

  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.byteLength;
    onProgress(received, total);
  }
  const out = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return out;
}

export async function loadModel(onState: (state: LoadState) => void): Promise<void> {
  if (isReady()) {
    onState({ stage: "ready", receivedBytes: 1, totalBytes: 1 });
    return;
  }
  if (loading) return loading;

  loading = (async () => {
    try {
      onState({ stage: "fetching", receivedBytes: 0, totalBytes: 0 });
      const ort = await import("onnxruntime-web");
      ortModule = ort;
      // Single-threaded SIMD: no cross-origin-isolation headers needed, which keeps the
      // app embeddable and installable anywhere. MobileNetV2 at 224px does not need more.
      ort.env.wasm.wasmPaths = "/ort/";
      ort.env.wasm.numThreads = 1;
      ort.env.logLevel = "error";

      const [bytes, labels] = await Promise.all([
        fetchWithProgress(MODEL_URL, (receivedBytes, totalBytes) =>
          onState({ stage: "fetching", receivedBytes, totalBytes }),
        ),
        fetch(LABELS_URL).then((r) => r.json() as Promise<ModelMeta>),
      ]);
      meta = labels;

      onState({ stage: "compiling", receivedBytes: bytes.byteLength, totalBytes: bytes.byteLength });
      session = await ort.InferenceSession.create(bytes, {
        executionProviders: ["wasm"],
        graphOptimizationLevel: "all",
      });
      onState({ stage: "ready", receivedBytes: bytes.byteLength, totalBytes: bytes.byteLength });
    } catch (err) {
      session = null;
      onState({
        stage: "error",
        receivedBytes: 0,
        totalBytes: 0,
        message: err instanceof Error ? err.message : "Model failed to load",
      });
      throw err;
    } finally {
      loading = null;
    }
  })();

  return loading;
}

/** Centre-crop to a square, resize to 224, return CHW float32 in 0-255. */
export function toTensorData(source: CanvasImageSource, width: number, height: number) {
  const side = Math.min(width, height);
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(source, (width - side) / 2, (height - side) / 2, side, side, 0, 0, SIZE, SIZE);
  const { data } = ctx.getImageData(0, 0, SIZE, SIZE);

  const plane = SIZE * SIZE;
  const chw = new Float32Array(plane * 3);
  for (let i = 0; i < plane; i += 1) {
    chw[i] = data[i * 4];
    chw[i + plane] = data[i * 4 + 1];
    chw[i + plane * 2] = data[i * 4 + 2];
  }
  return { chw, preview: canvas };
}

export interface RunResult {
  predictions: Prediction[];
  latencyMs: number;
  preprocessMs: number;
  thumbnail: string;
}

export async function classify(
  source: CanvasImageSource,
  width: number,
  height: number,
  topK = 3,
): Promise<RunResult> {
  if (!session || !meta || !ortModule) throw new Error("Model is not loaded");

  const t0 = performance.now();
  const { chw, preview } = toTensorData(source, width, height);
  const tensor: Tensor = new ortModule.Tensor("float32", chw, [1, 3, SIZE, SIZE]);
  const preprocessMs = performance.now() - t0;

  const t1 = performance.now();
  const output = await session.run({ pixels: tensor });
  const latencyMs = performance.now() - t1;

  const probs = output.probabilities.data as Float32Array;
  const predictions: Prediction[] = Array.from(probs)
    .map((probability, index) => ({ index, probability, entry: meta!.classes[index] }))
    .sort((a, b) => b.probability - a.probability)
    .slice(0, topK);

  return {
    predictions,
    latencyMs,
    preprocessMs,
    thumbnail: preview.toDataURL("image/jpeg", 0.72),
  };
}
