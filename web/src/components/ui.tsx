"use client";

import clsx from "clsx";
import type { ReactNode } from "react";

export function LeafMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={clsx("h-7 w-7", className)} aria-hidden="true">
      <path
        d="M26 5c0 11-6.6 18.5-16.2 19.6C8.2 18 12.4 9.6 26 5Z"
        fill="#2f9e64"
        opacity="0.92"
      />
      <path
        d="M6 27c3.4-9.4 9.6-16.2 18.6-20.6"
        fill="none"
        stroke="#14181a"
        strokeWidth="1.9"
        strokeLinecap="round"
        opacity="0.75"
      />
      <circle cx="24.5" cy="24.5" r="4.5" fill="none" stroke="#1c6b45" strokeWidth="1.8" />
      <path d="M27.8 27.8 30.5 30.5" stroke="#1c6b45" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={clsx("card", className)}>{children}</div>;
}

export function CardHead({ title, hint, right }: { title: string; hint?: string; right?: ReactNode }) {
  return (
    <header className="flex items-baseline justify-between gap-3 border-b border-bone-200 px-4 py-3">
      <div className="min-w-0">
        <h2 className="truncate text-[13.5px] font-semibold text-ink-900">{title}</h2>
        {hint ? <p className="mt-0.5 truncate text-[11.5px] text-ink-300">{hint}</p> : null}
      </div>
      {right}
    </header>
  );
}

export function Stat({
  label,
  value,
  unit,
  hint,
  tone = "text-ink-900",
}: {
  label: string;
  value: ReactNode;
  unit?: string;
  hint?: string;
  tone?: string;
}) {
  return (
    <div>
      <div className="label">{label}</div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className={clsx("num text-[24px] font-semibold leading-none tracking-tight", tone)}>{value}</span>
        {unit ? <span className="text-[11.5px] text-ink-300">{unit}</span> : null}
      </div>
      {hint ? <div className="mt-1 text-[11px] leading-snug text-ink-300">{hint}</div> : null}
    </div>
  );
}

export function Bar({ value, tone = "bg-leaf-500" }: { value: number; tone?: string }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-bone-200">
      <div
        className="h-full rounded-full animate-grow"
        style={{ ["--w" as string]: `${Math.max(2, Math.min(100, value))}%`, width: `${Math.max(2, Math.min(100, value))}%` }}
        data-tone={tone}
      >
        <div className={clsx("h-full w-full rounded-full", tone)} />
      </div>
    </div>
  );
}

export function OfflineBadge({ online }: { online: boolean }) {
  return (
    <span
      className={clsx(
        "pill",
        online ? "border-bone-200 text-ink-500" : "border-leaf-300 bg-leaf-100 text-leaf-700",
      )}
      title={
        online
          ? "You are online. Inference still runs on this device."
          : "You are offline and the app is still working — the model is cached locally."
      }
    >
      <span className={clsx("h-1.5 w-1.5 rounded-full", online ? "bg-ink-300" : "bg-leaf-600")} />
      {online ? "Online" : "Offline · still working"}
    </span>
  );
}
