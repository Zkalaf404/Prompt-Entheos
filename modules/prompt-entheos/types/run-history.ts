import type { PromptScore } from "@/modules/prompt-entheos/types/prompt";
import type { ProviderId } from "@/modules/prompt-entheos/types/provider";
import type { SupportedTask } from "@/modules/prompt-entheos/types/task";

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
  optimizedPrompt: string;
  rationale: {
    summary: string;
    reasons: string[];
  };
  score: PromptScore;
  resolvedProvider: SavedRunResolvedProvider;
  resolvedTask: SavedRunResolvedTask;
  createdAt: string;
}
