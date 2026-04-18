import type { PromptScore } from "@/modules/prompt-entheos/types";
import type { ProviderId } from "@/modules/prompt-entheos/types/provider";
import type { SupportedTask } from "@/modules/prompt-entheos/types/task";

export interface PromptOptimizationRequest {
  provider: string;
  task: string;
  rawPrompt: string;
  context?: string;
  brandId?: string;
}

export interface PromptOptimizationProviderOption {
  id: ProviderId;
  name: string;
  description: string;
  supportedTasks: SupportedTask[];
}

export interface PromptOptimizationTaskOption {
  id: SupportedTask;
  name: string;
  description: string;
}

export interface PromptOptimizationMetadataResponse {
  providers: PromptOptimizationProviderOption[];
  tasks: PromptOptimizationTaskOption[];
  defaults: {
    provider: ProviderId;
    task: SupportedTask;
  };
}

export interface PromptOptimizationSuccessResponse {
  ok: true;
  optimizedPrompt: string;
  rationale: {
    summary: string;
    reasons: string[];
  };
  score: PromptScore;
  resolvedProvider: PromptOptimizationProviderOption;
  resolvedTask: PromptOptimizationTaskOption;
}

export interface PromptOptimizationErrorResponse {
  ok: false;
  error: {
    code:
      | "EMPTY_PROMPT"
      | "INVALID_BRAND"
      | "INVALID_PROVIDER"
      | "INVALID_TASK"
      | "PROVIDER_NOT_RESOLVED"
      | "TASK_NOT_RESOLVED"
      | "TASK_NOT_SUPPORTED";
    message: string;
  };
  suggestions: {
    providers: PromptOptimizationProviderOption[];
    tasks: PromptOptimizationTaskOption[];
  };
}

export type PromptOptimizationResponse =
  | PromptOptimizationSuccessResponse
  | PromptOptimizationErrorResponse;
