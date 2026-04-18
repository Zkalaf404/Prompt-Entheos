"use client";

import type { RunComparison } from "@/modules/prompt-entheos/types";
import {
  Badge,
  EmptyState,
  SectionHeader,
  WorkspaceSection,
  mutedSurfaceClass,
  nestedSurfaceClass,
  secondaryButtonClass,
  subtleButtonClass,
} from "@/app/components/workspace-ui";

function CompareBlock({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className={mutedSurfaceClass}>
      <p className="text-xs tracking-[0.18em] text-slate-500 uppercase">{label}</p>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-200">{value}</p>
    </div>
  );
}

function getRunRole(comparison: RunComparison, runId: string): string {
  if (comparison.relationship.parentRunId === runId) {
    return "Parent run";
  }

  if (comparison.relationship.childRunId === runId) {
    return "Child refinement";
  }

  return comparison.runs[0].id === runId ? "Run A" : "Run B";
}

function getBrandLabel(run: RunComparison["runs"][number]): string {
  return run.brandProfileName ?? run.brandProfileId ?? (run.brandId ? "Legacy brand memory" : "None");
}

interface RunComparePanelProps {
  comparison: RunComparison | null;
  isLoading: boolean;
  onBackToOptimizer: () => void;
  onClose: () => void;
  onRefine: (runId: string) => void;
  onReuse: (runId: string) => void;
  refiningRunId: string | null;
  reusingRunId: string | null;
}

export function RunComparePanel({
  comparison,
  isLoading,
  onBackToOptimizer,
  onClose,
  onRefine,
  onReuse,
  refiningRunId,
  reusingRunId,
}: RunComparePanelProps) {
  if (isLoading) {
    return (
      <WorkspaceSection>
        <SectionHeader
          eyebrow="Compare"
          title="Run comparison"
          description="Building the side-by-side comparison view..."
        />
      </WorkspaceSection>
    );
  }

  if (!comparison) {
    return (
      <WorkspaceSection>
        <SectionHeader
          eyebrow="Compare"
          title="Side-by-side review"
          description="When two runs are selected, this panel turns into a focused comparison workspace for prompt quality, rationale, and lineage."
        />
        <div className="mt-6">
          <EmptyState
            title="Select two runs to compare"
            description="Compare raw prompts, optimized outputs, rationale, score, provider, task, and linked brand profile in one readable review surface."
          />
        </div>
      </WorkspaceSection>
    );
  }

  return (
    <WorkspaceSection>
      <SectionHeader
        eyebrow="Compare"
        title="Run comparison"
        description={comparison.relationship.message}
        actions={
          <>
            <button type="button" className={secondaryButtonClass} onClick={onBackToOptimizer}>
              Back to optimizer
            </button>
            <button type="button" className={subtleButtonClass} onClick={onClose}>
              Close compare
            </button>
          </>
        }
      />

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        {comparison.runs.map((run) => (
          <article key={run.id} className={nestedSurfaceClass}>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="accent">{getRunRole(comparison, run.id)}</Badge>
              <Badge>{run.resolvedProvider.name}</Badge>
              <Badge>{run.resolvedTask.name}</Badge>
            </div>

            <p className="mt-4 text-xs text-slate-500">
              {new Date(run.createdAt).toLocaleString("en-US")}
            </p>

            <div className="mt-5 grid gap-3">
              <CompareBlock label="Brand profile" value={getBrandLabel(run)} />
              <CompareBlock label="Raw prompt" value={run.rawPrompt} />
              <CompareBlock label="Optimized prompt" value={run.optimizedPrompt} />
              <CompareBlock
                label="Rationale"
                value={[run.rationale.summary, ...run.rationale.reasons].join("\n\n")}
              />
              <CompareBlock
                label="Score"
                value={`Overall: ${run.score.overall}\nClarity: ${run.score.breakdown.clarity}\nStructure: ${run.score.breakdown.structure}\nSpecificity: ${run.score.breakdown.specificity}\nProvider fit: ${run.score.breakdown.providerFit}\nConstraint coverage: ${run.score.breakdown.constraintCoverage}\n\n${run.score.summary}`}
              />
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                className={secondaryButtonClass}
                onClick={() => onReuse(run.id)}
                disabled={Boolean(reusingRunId || refiningRunId)}
              >
                {reusingRunId === run.id ? "Loading..." : "Reuse this run"}
              </button>
              <button
                type="button"
                className={subtleButtonClass}
                onClick={() => onRefine(run.id)}
                disabled={Boolean(reusingRunId || refiningRunId)}
              >
                {refiningRunId === run.id ? "Preparing..." : "Refine from this run"}
              </button>
            </div>
          </article>
        ))}
      </div>
    </WorkspaceSection>
  );
}
