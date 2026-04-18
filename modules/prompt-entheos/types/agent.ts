import type { NormalizedBrandContext } from "@/modules/prompt-entheos/types/brand";
import type { PromptContextPack } from "@/modules/prompt-entheos/types/intelligence";
import type { ProviderMetadata } from "@/modules/prompt-entheos/types/provider";
import type { ProviderKnowledge } from "@/modules/prompt-entheos/types/knowledge";
import type { OptimizedPrompt } from "@/modules/prompt-entheos/types/prompt";
import type { SupportedTask } from "@/modules/prompt-entheos/types/task";

export interface PromptAgentInput {
  rawPrompt: string;
  task: SupportedTask;
  brandContext?: NormalizedBrandContext;
  promptContextPack?: PromptContextPack;
  language?: string;
  constraints?: string[];
}

export interface PromptAgent {
  readonly id: string;
  readonly provider: ProviderMetadata;
  readonly knowledge: ProviderKnowledge;
  optimize(input: PromptAgentInput): OptimizedPrompt;
}

export type PromptOptimizationAgent = PromptAgent;
