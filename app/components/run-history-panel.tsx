"use client";

import type { BrandProfile, SavedPromptRun } from "@/modules/prompt-entheos/types";

interface RunHistoryPanelProps {
  brands: BrandProfile[];
  deletingRunId: string | null;
  isLoading: boolean;
  onDelete: (runId: string) => void;
  onReuse: (runId: string) => void;
  reusingRunId: string | null;
  runs: SavedPromptRun[];
}

function findBrandName(brands: BrandProfile[], brandId?: string): string | null {
  if (!brandId) {
    return null;
  }

  return brands.find((brand) => brand.id === brandId)?.name ?? "Deleted brand";
}

export function RunHistoryPanel({
  brands,
  deletingRunId,
  isLoading,
  onDelete,
  onReuse,
  reusingRunId,
  runs,
}: RunHistoryPanelProps) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/6 p-5 backdrop-blur-xl sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm tracking-[0.18em] text-slate-400 uppercase">Run History</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Previous optimizations</h2>
        </div>
        <p className="text-sm leading-7 text-slate-300">
          Reuse a previous run to repopulate the form, then refine it further.
        </p>
      </div>

      {isLoading ? (
        <div className="mt-5 rounded-[1.5rem] border border-white/8 bg-slate-950/50 px-4 py-6 text-sm text-slate-300">
          Loading history...
        </div>
      ) : null}

      {!isLoading && runs.length === 0 ? (
        <div className="mt-5 rounded-[1.5rem] border border-dashed border-white/12 bg-slate-950/45 px-5 py-10 text-center">
          <p className="text-lg font-medium text-white">No saved runs yet</p>
          <p className="mt-2 text-sm leading-7 text-slate-300">
            Successful optimizations will be stored locally here so you can reopen and reuse them.
          </p>
        </div>
      ) : null}

      {!isLoading && runs.length > 0 ? (
        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          {runs.map((run) => {
            const brandName = findBrandName(brands, run.brandId);

            return (
              <article
                key={run.id}
                className="rounded-[1.5rem] border border-white/8 bg-slate-950/55 p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-cyan-300/15 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-100">
                    {run.resolvedProvider.name}
                  </span>
                  <span className="rounded-full border border-emerald-300/15 bg-emerald-300/10 px-3 py-1 text-xs text-emerald-100">
                    {run.resolvedTask.name}
                  </span>
                  {brandName ? (
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">
                      {brandName}
                    </span>
                  ) : null}
                </div>

                <p className="mt-4 text-sm leading-7 text-slate-200">
                  {run.rawPrompt.length > 160 ? `${run.rawPrompt.slice(0, 160)}...` : run.rawPrompt}
                </p>

                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-slate-400">
                    {new Date(run.createdAt).toLocaleString("en-US")}
                  </p>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-70"
                      onClick={() => onReuse(run.id)}
                      disabled={Boolean(reusingRunId || deletingRunId)}
                    >
                      {reusingRunId === run.id ? "Loading..." : "Reuse"}
                    </button>
                    <button
                      type="button"
                      className="rounded-full border border-rose-300/20 bg-rose-400/10 px-4 py-2 text-sm text-rose-100 transition hover:bg-rose-400/20 disabled:cursor-not-allowed disabled:opacity-70"
                      onClick={() => onDelete(run.id)}
                      disabled={Boolean(reusingRunId || deletingRunId)}
                    >
                      {deletingRunId === run.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
