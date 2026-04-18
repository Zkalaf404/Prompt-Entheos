"use client";

import type {
  BrandDraft,
  BrandProfile,
  BrandValidationErrors,
} from "@/modules/prompt-entheos/types";

interface BrandEditorModalProps {
  brand?: BrandProfile | null;
  errors: BrandValidationErrors;
  isOpen: boolean;
  isSubmitting: boolean;
  mode: "create" | "edit";
  onChange: <Key extends keyof BrandDraft>(field: Key, value: BrandDraft[Key]) => void;
  onClose: () => void;
  onDelete?: () => void;
  onSave: () => void;
  value: BrandDraft;
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-xs text-rose-200">{message}</p>;
}

export function BrandEditorModal({
  brand,
  errors,
  isOpen,
  isSubmitting,
  mode,
  onChange,
  onClose,
  onDelete,
  onSave,
  value,
}: BrandEditorModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 py-8 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-[2rem] border border-white/10 bg-[#091321] p-6 shadow-2xl shadow-black/40">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm tracking-[0.18em] text-slate-400 uppercase">Brand Memory</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              {mode === "create" ? "Create Brand" : "Edit Brand"}
            </h2>
            <p className="mt-2 text-sm leading-7 text-slate-300">
              Save the audience, tone, and business context once, then reuse it in every prompt run.
            </p>
          </div>

          <button
            type="button"
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Close
          </button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-200">Brand name</span>
            <input
              className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/40"
              value={value.name}
              onChange={(event) => onChange("name", event.target.value)}
              disabled={isSubmitting}
            />
            <FieldError message={errors.name} />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-200">Audience</span>
            <input
              className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/40"
              value={value.audience}
              onChange={(event) => onChange("audience", event.target.value)}
              disabled={isSubmitting}
            />
            <FieldError message={errors.audience} />
          </label>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-200">Tone</span>
            <input
              className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/40"
              value={value.tone}
              onChange={(event) => onChange("tone", event.target.value)}
              disabled={isSubmitting}
            />
            <FieldError message={errors.tone} />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-200">Notes</span>
            <input
              className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/40"
              value={value.notes ?? ""}
              onChange={(event) => onChange("notes", event.target.value)}
              disabled={isSubmitting}
              placeholder="Optional guidance or caveats"
            />
          </label>
        </div>

        <label className="mt-4 block space-y-2">
          <span className="text-sm font-medium text-slate-200">Description</span>
          <textarea
            className="min-h-32 w-full rounded-[1.5rem] border border-white/10 bg-slate-950/70 px-4 py-4 text-sm leading-7 text-white outline-none transition focus:border-cyan-300/40"
            value={value.description}
            onChange={(event) => onChange("description", event.target.value)}
            disabled={isSubmitting}
          />
          <FieldError message={errors.description} />
        </label>

        {brand ? (
          <p className="mt-4 text-xs text-slate-400">
            Last updated: {new Date(brand.updatedAt).toLocaleString("en-US")}
          </p>
        ) : null}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {mode === "edit" && onDelete ? (
            <button
              type="button"
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-rose-300/20 bg-rose-400/10 px-5 text-sm font-medium text-rose-100 transition hover:bg-rose-400/20 disabled:cursor-not-allowed disabled:opacity-70"
              onClick={onDelete}
              disabled={isSubmitting}
            >
              Delete Brand
            </button>
          ) : (
            <div />
          )}

          <div className="flex gap-3">
            <button
              type="button"
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/10 bg-white/5 px-5 text-sm font-medium text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-70"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="button"
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-gradient-to-l from-emerald-300 to-cyan-300 px-6 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
              onClick={onSave}
              disabled={isSubmitting}
            >
              {isSubmitting
                ? mode === "create"
                  ? "Saving..."
                  : "Updating..."
                : mode === "create"
                  ? "Save Brand"
                  : "Update Brand"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
