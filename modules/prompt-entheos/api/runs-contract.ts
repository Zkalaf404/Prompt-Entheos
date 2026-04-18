import type { SavedPromptRun } from "@/modules/prompt-entheos/types";

export interface RunsListResponse {
  runs: SavedPromptRun[];
}

export interface RunResponse {
  run: SavedPromptRun;
}

export interface RunDeleteResponse {
  ok: true;
  message: string;
}

export interface RunErrorResponse {
  ok: false;
  error: {
    code: "NOT_FOUND" | "UNKNOWN_ERROR";
    message: string;
  };
}
