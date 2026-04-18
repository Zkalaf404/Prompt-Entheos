"use client";

import type { ReactNode } from "react";

export const surfaceClass =
  "rounded-[28px] border border-white/8 bg-[#10161f]/92 shadow-[0_18px_60px_rgba(2,6,23,0.32)] backdrop-blur";

export const nestedSurfaceClass =
  "rounded-[24px] border border-white/8 bg-[#0b1118] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]";

export const mutedSurfaceClass =
  "rounded-[22px] border border-white/8 bg-white/[0.03] p-4";

export const inputClass =
  "w-full rounded-2xl border border-white/10 bg-[#0a1017] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/35 focus:bg-[#0c131d]";

export const textareaClass =
  "w-full rounded-[22px] border border-white/10 bg-[#0a1017] px-4 py-4 text-sm leading-7 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/35 focus:bg-[#0c131d]";

export const primaryButtonClass =
  "inline-flex min-h-11 items-center justify-center rounded-full bg-cyan-300 px-5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60";

export const secondaryButtonClass =
  "inline-flex min-h-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] px-5 text-sm font-medium text-white transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60";

export const subtleButtonClass =
  "inline-flex min-h-10 items-center justify-center rounded-full border border-white/10 bg-transparent px-4 text-sm font-medium text-slate-200 transition hover:border-white/18 hover:bg-white/[0.04] disabled:cursor-not-allowed disabled:opacity-60";

export const dangerButtonClass =
  "inline-flex min-h-10 items-center justify-center rounded-full border border-rose-400/20 bg-rose-400/10 px-4 text-sm font-medium text-rose-100 transition hover:bg-rose-400/18 disabled:cursor-not-allowed disabled:opacity-60";

export function WorkspaceSection({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={`${surfaceClass} p-5 sm:p-6 ${className}`.trim()}>{children}</section>;
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="max-w-3xl">
        <p className="text-[11px] font-medium tracking-[0.24em] text-slate-500 uppercase">
          {eyebrow}
        </p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">{title}</h2>
        {description ? (
          <p className="mt-3 text-sm leading-7 text-slate-400">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-[24px] border border-dashed border-white/10 bg-[#0b1118] px-6 py-12 text-center">
      <p className="text-lg font-semibold text-white">{title}</p>
      <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-400">{description}</p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "accent" | "success" | "warning";
}) {
  const toneClass =
    tone === "accent"
      ? "border-cyan-300/18 bg-cyan-300/10 text-cyan-100"
      : tone === "success"
        ? "border-emerald-300/18 bg-emerald-300/10 text-emerald-100"
        : tone === "warning"
          ? "border-amber-300/18 bg-amber-300/10 text-amber-100"
          : "border-white/10 bg-white/[0.04] text-slate-200";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-medium tracking-[0.16em] uppercase ${toneClass}`}
    >
      {children}
    </span>
  );
}

export function MetricCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper?: string;
}) {
  return (
    <div className={mutedSurfaceClass}>
      <p className="text-xs tracking-[0.18em] text-slate-500 uppercase">{label}</p>
      <p className="mt-3 text-2xl font-semibold text-white">{value}</p>
      {helper ? <p className="mt-2 text-sm leading-6 text-slate-400">{helper}</p> : null}
    </div>
  );
}
