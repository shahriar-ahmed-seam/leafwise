/**
 * Copies the ONNX Runtime Web binaries into /public/ort so the app serves them from its
 * own origin (no CDN dependency at runtime — an offline-first app cannot rely on one).
 *
 * Runs automatically before dev and build.
 */

import { copyFile, mkdir, readdir, stat } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const src = join(here, "..", "node_modules", "onnxruntime-web", "dist");
const dest = join(here, "..", "public", "ort");

// WASM only. The jsep (WebGPU) build is ~11 MB and unused: this app pins the wasm
// execution provider so behaviour is identical on every device, including old phones.
const WANTED = /^ort-.*\.(wasm|mjs)$/;
const SKIP = /jsep|training|webgpu/;

try {
  await mkdir(dest, { recursive: true });
  const files = (await readdir(src)).filter((f) => WANTED.test(f) && !SKIP.test(f));
  if (!files.length) throw new Error("no onnxruntime-web dist files found");

  let copied = 0;
  let bytes = 0;
  for (const file of files) {
    const from = join(src, file);
    const to = join(dest, file);
    const info = await stat(from);
    let skip = false;
    try {
      const existing = await stat(to);
      skip = existing.size === info.size;
    } catch {
      skip = false;
    }
    if (!skip) {
      await copyFile(from, to);
      copied += 1;
    }
    bytes += info.size;
  }
  console.log(
    `[prepare-assets] ort runtime ready: ${files.length} files, ${(bytes / 1e6).toFixed(1)} MB (${copied} copied)`,
  );
} catch (err) {
  console.error(`[prepare-assets] ${err instanceof Error ? err.message : err}`);
  process.exit(1);
}
