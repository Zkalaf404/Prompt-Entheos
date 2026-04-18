"use client";

import type {
  PromptOptimizationProviderOption,
  PromptOptimizationTaskOption,
} from "@/modules/prompt-entheos/api/prompt-optimization-contract";
import type {
  BrandIntelligenceProfile,
  RunFilters,
  SavedPromptRun,
} from "@/modules/prompt-entheos/types";
import {
  Badge,
  EmptyState,
  SectionHeader,
  WorkspaceSection,
  dangerButtonClass,
  inputClass,
  secondaryButtonClass,
  subtleButtonClass,
} from "@/app/components/workspace-ui";

interface RunHistoryPanelProps {
  deletingRunId: string | null;
  filters: RunFilters;
  isCompareMode: boolean;
  isComparing: boolean;
  isLoading: boolean;
  onCompare: () => void;
  onDelete: (runId: string) => void;
  onFilterChange: (filters: RunFilters) => void;
  onRefine: (runId: string) => void;
  onReuse: (runId: string) => void;
  onToggleCompareMode: () => void;
  onToggleRunSelection: (runId: string) => void;
  profiles: BrandIntelligenceProfile[];
  providers: PromptOptimizationProviderOption[];
  refiningRunId: string | null;
  reusingRunId: string | null;
  runs: SavedPromptRun[];
  selectedCompareRunIds: string[];
  tasks: PromptOptimizationTaskOption[];
}

function findProfileName(
  profiles: BrandIntelligenceProfile[],
  run: SavedPromptRun,
): string | null {
  if (run.brandProfileName) {
    return run.brandProfileName;
  }

  if (run.brandProfileId) {
    return profiles.find((profile) => profile.id === run.brandProfileId)?.companyName ?? "Deleted profile";
  }

  if (run.brandId) {
    return "Legacy brand memory";
  }

  return null;
}

function getLineageLabel(run: SavedPromptRun): string {
  return run.parentRunId ? "Refinement" : "Original";
}

export function RunHistoryPanel({
  deletingRunId,
  filters,
  isCompareMode,
  isComparing,
  isLoading,
  onCompare,
  onDelete,
  onFilterChange,
  onRefine,
  onReuse,
  onToggleCompareMode,
  onToggleRunSelection,
  profiles,
  providers,
  refiningRunId,
  reusingRunId,
  runs,
  selectedCompareRunIds,
  tasks,
}: RunHistoryPanelProps) {
  return (
    <WorkspaceSection>
      <SectionHeader
        eyebrow="Run History"
        title="Iterative prompt workspace"
        description="Browse saved runs, filter by provider or profile, reopen drafts, and branch new refinements without leaving the workspace."
        actions={
          <>
            <button type="button" className={secondaryButtonClass} onClick={onToggleCompareMode}>
              {isCompareMode ? "Exit compare" : "Compare mode"}
            </button>
            <button
              type="button"
              className={subtleButtonClass}
              onClick={() =>
                onFilterChange({
                  provider: undefined,
                  task: undefined,
                  brandProfileId: undefined,
                })
              }
            >
              Clear filters
            </button>
          </>
        }
      />

      <div className="mt-6 grid gap-3 xl:grid-cols-[1fr_1fr_1fr_auto]">
        <label className="space-y-2">
          <span className="text-xs tracking-[0.16em] text-slate-500 uppercase">Provider</span>
          <select
            className={inputClass}
            value={filters.provider ?? ""}
            onChange={(event) =>
              onFilterChange({
                ...filters,
                provider: event.target.value || undefined,
              })
            }
          >
            <option value="">All providers</option>
            {providers.map((provider) => (
              <option key={provider.id} value={provider.id}>
                {provider.name}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-xs tracking-[0.16em] text-slate-500 uppercase">Task</span>
          <select
            className={inputClass}
            value={filters.task ?? ""}
            onChange={(event) =>
              onFilterChange({
                ...filters,
                task: event.target.value || undefined,
              })
            }
          >
            <option value="">All tasks</option>
            {tasks.map((task) => (
              <option key={task.id} value={task.id}>
                {task.name}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-xs tracking-[0.16em] text-slate-500 uppercase">Brand profile</span>
          <select
            className={inputClass}
            value={filters.brandProfileId ?? ""}
            onChange={(event) =>
              onFilterChange({
                ...filters,
                brandProfileId: event.target.value || undefined,
              })
            }
          >
            <option value="">All profiles</option>
            {profiles.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.companyName}
              </option>
            ))}
          </select>
        </label>

        {isCompareMode ? (
          <div className="flex items-end">
            <button
              type="button"
              className={secondaryButtonClass}
              onClick={onCompare}
              disabled={selectedCompareRunIds.length !== 2 || isComparing}
            >
              {isComparing ? "Comparing..." : `Compare (${selectedCompareRunIds.length}/2)`}
            </button>
          </div>
        ) : (
          <div className="flex items-end">
            <div className="rounded-2xl border border-white/8 bg-[#0b1118] px-4 py-3 text-sm text-slate-400">
              Sorted by newest first
            </div>
          </div>
        )}
      </div>

      {isCompareMode ? (
        <div className="mt-4 rounded-[22px] border border-cyan-300/18 bg-cyan-300/10 px-4 py-4 text-sm leading-7 text-cyan-50">
          Select exactly two runs to review them side by side. If you switch selections, the comparison resets automatically.
        </div>
      ) : null}

      {isLoading ? (
        <div className="mt-6 rounded-[24px] border border-white/8 bg-[#0b1118] px-5 py-6 text-sm text-slate-300">
          Loading run history...
        </div>
      ) : null}

      {!isLoading && runs.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="No runs match this view"
            description="Your saved optimizations will appear here with provider, task, profile context, and refinement lineage so you can keep iterating instead of starting over."
          />
        </div>
      ) : null}

      {!isLoading && runs.length > 0 ? (
        <div className="mt-6 grid gap-3">
          {runs.map((run) => {
            const brandName = findProfileName(profiles, run);
            const isSelectedForCompare = selectedCompareRunIds.includes(run.id);
            const isBusy = Boolean(reusingRunId || deletingRunId || refiningRunId);

            return (
              <article
                key={run.id}
                className={`rounded-[24px] border p-5 transition ${
                  isSelectedForCompare
                    ? "border-cyan-300/25 bg-cyan-300/[0.08]"
                    : "border-white/8 bg-[#0b1118] hover:border-white/14 hover:bg-white/[0.03]"
                }`}
              >
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="accent">{run.resolvedProvider.name}</Badge>
                      <Badge tone="success">{run.resolvedTask.name}</Badge>
                      <Badge>{getLineageLabel(run)}</Badge>
                      {brandName ? <Badge>{brandName}</Badge> : null}
                    </div>

                    <p className="mt-4 text-sm leading-7 text-slate-200">
                      {run.rawPrompt.length > 220 ? `${run.rawPrompt.slice(0, 220)}...` : run.rawPrompt}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
                      <span>Created {new Date(run.createdAt).toLocaleString("en-US")}</span>
                      {run.parentRunId ? <span>Parent {run.parentRunId.slice(0, 8)}</span> : null}
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 xl:min-w-56">
                    {isCompareMode ? (
                      <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-200">
                        <span>Select for compare</span>
                        <input
                          type="checkbox"
                          className="h-4 w-4 accent-cyan-300"
                          checked={isSelectedForCompare}
                          onChange={() => onToggleRunSelection(run.id)}
                        />
                      </label>
                    ) : null}

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className={secondaryButtonClass}
                        onClick={() => onReuse(run.id)}
                        disabled={isBusy}
                      >
                        {reusingRunId === run.id ? "Loading..." : "Reuse"}
                      </button>
                      <button
                        type="button"
                        className={subtleButtonClass}
                        onClick={() => onRefine(run.id)}
                        disabled={isBusy}
                      >
                        {refiningRunId === run.id ? "Preparing..." : "Refine"}
                      </button>
                      <button
                        type="button"
                        className={dangerButtonClass}
                        onClick={() => onDelete(run.id)}
                        disabled={isBusy}
                      >
                        {deletingRunId === run.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : null}
    </WorkspaceSection>
  );
}
