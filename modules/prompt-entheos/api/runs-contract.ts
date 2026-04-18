import type {
  RunComparison,
  RunFilters,
  RunLineage,
  RunRefinementDraft,
  SavedPromptRun,
} from "@/modules/prompt-entheos/types";

export interface RunsListResponse {
  runs: SavedPromptRun[];
  filters: RunFilters;
  sort: "newest";
}

export interface RunResponse {
  run: SavedPromptRun;
}

export interface RunRefinementResponse {
  sourceRun: SavedPromptRun;
  draft: RunRefinementDraft;
  lineage: RunLineage;
}

export interface RunCompareResponse {
  comparison: RunComparison;
}

export interface RunDeleteResponse {
  ok: true;
  message: string;
}

export interface RunErrorResponse {
  ok: false;
  error: {
    code: "INVALID_COMPARE" | "NOT_FOUND" | "UNKNOWN_ERROR";
    message: string;
  };
}
