import type { NormalizedBrandContext } from "@/modules/prompt-entheos/types/brand";
import type { ProviderResolution } from "@/modules/prompt-entheos/resolver/provider-resolver";
import type { OptimizedPrompt, PromptAnalysis, PromptInput } from "@/modules/prompt-entheos/types/prompt";
import type { ProviderMetadata } from "@/modules/prompt-entheos/types/provider";
import type { SupportedTask, TaskDefinition } from "@/modules/prompt-entheos/types/task";

export interface PromptPipelineInput extends PromptInput {
  provider?: string;
  task?: SupportedTask | string;
}

export interface NormalizedPromptInput {
  rawPrompt: string;
  context?: string;
  brandContext?: NormalizedBrandContext;
  provider?: string;
  targetHint?: string;
  task?: SupportedTask;
  language: string;
  constraints: string[];
}

export interface PromptPipelineSuccess {
  ok: true;
  input: NormalizedPromptInput;
  provider: ProviderMetadata;
  task: TaskDefinition;
  resolution: ProviderResolution;
  analysis: PromptAnalysis;
  output: OptimizedPrompt;
}

export interface PromptPipelineFailure {
  ok: false;
  input: NormalizedPromptInput;
  resolution?: ProviderResolution;
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
    providers: ProviderMetadata[];
    tasks: TaskDefinition[];
  };
}

export type PromptPipelineResult = PromptPipelineSuccess | PromptPipelineFailure;

export type PromptOptimizationPipelineSuccess = PromptPipelineSuccess;
export type PromptOptimizationPipelineFailure = PromptPipelineFailure;
export type PromptOptimizationPipelineResult = PromptPipelineResult;
