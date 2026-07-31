"use client";

/** Scan history in IndexedDB — nothing leaves the device, and it survives being offline. */

import { del, get, set } from "idb-keyval";

import type { ScanResult } from "./types";

const KEY = "leafwise.scans.v1";
const LIMIT = 40;

export async function loadHistory(): Promise<ScanResult[]> {
  try {
    return (await get<ScanResult[]>(KEY)) ?? [];
  } catch {
    return [];
  }
}

export async function pushHistory(entry: ScanResult): Promise<ScanResult[]> {
  const next = [entry, ...(await loadHistory())].slice(0, LIMIT);
  await set(KEY, next);
  return next;
}

export async function clearHistory(): Promise<void> {
  await del(KEY);
}

export function exportCsv(entries: ScanResult[]): string {
  const rows = [
    ["timestamp", "crop", "condition", "confidence", "second_guess", "second_confidence", "latency_ms", "source"],
    ...entries.map((e) => {
      const [first, second] = e.predictions;
      return [
        new Date(e.at).toISOString(),
        first?.entry.crop ?? "",
        first?.entry.condition ?? "",
        first ? (first.probability * 100).toFixed(1) : "",
        second ? `${second.entry.crop} ${second.entry.condition}` : "",
        second ? (second.probability * 100).toFixed(1) : "",
        e.latencyMs.toFixed(1),
        e.source,
      ];
    }),
  ];
  return rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
}
