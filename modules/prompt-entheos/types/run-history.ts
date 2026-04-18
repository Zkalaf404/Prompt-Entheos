import type { PromptScore } from "@/modules/prompt-entheos/types/prompt";
import type { ProviderId } from "@/modules/prompt-entheos/types/provider";
import type { SupportedTask } from "@/modules/prompt-entheos/types/task";

export type RunRefinementType = "manual-refinement";

export interface SavedRunResolvedProvider {
  id: ProviderId;
  name: string;
  description: string;
}

export interface SavedRunResolvedTask {
  id: SupportedTask;
  name: string;
  description: string;
}

export interface SavedPromptRun {
  id: string;
  provider: string;
  task: string;
  rawPrompt: string;
  context?: string;
  brandId?: string;
  brandProfileId?: string;
  brandProfileName?: string;
  optimizedPrompt: string;
  rationale: {
    summary: string;
    reasons: string[];
  };
  score: PromptScore;
  resolvedProvider: SavedRunResolvedProvider;
  resolvedTask: SavedRunResolvedTask;
  parentRunId?: string;
  refinementType?: RunRefinementType | string;
  createdAt: string;
  updatedAt: string;
}

export interface RunFilters {
  provider?: string;
  task?: string;
  brandProfileId?: string;
}

export interface RunRefinementDraft {
  provider: string;
  task: string;
  rawPrompt: string;
  context?: string;
  brandProfileId?: string;
  parentRunId: string;
  refinementType: RunRefinementType;
}

export interface RunLineage {
  isRefinement: boolean;
  parentRunId?: string;
  rootRunId: string;
  depth: number;
}

export interface RunComparisonRelationship {
  type: "parent-child" | "siblings" | "same-root" | "unrelated";
  message: string;
  parentRunId?: string;
  childRunId?: string;
  commonAncestorRunId?: string;
}

export interface RunComparison {
  runs: [SavedPromptRun, SavedPromptRun];
  relationship: RunComparisonRelationship;
}
