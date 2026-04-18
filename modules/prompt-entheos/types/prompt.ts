import type { NormalizedBrandContext } from "@/modules/prompt-entheos/types/brand";
import type { SupportedTask } from "@/modules/prompt-entheos/types/task";

export interface PromptInput {
  rawPrompt: string;
  context?: string;
  brandContext?: NormalizedBrandContext;
  provider?: string;
  providerId?: string;
  targetHint?: string;
  task?: SupportedTask | string;
  requestedTask?: SupportedTask;
  language?: string;
  constraints?: string[];
}

export type PromptLength = "short" | "medium" | "long";

export interface PromptAnalysis {
  normalizedPrompt: string;
  detectedTask: SupportedTask;
  promptLength: PromptLength;
  strengths: string[];
  issues: string[];
  missingContext: string[];
}

export interface PromptScoreBreakdown {
  clarity: number;
  structure: number;
  specificity: number;
  providerFit: number;
  constraintCoverage: number;
}

export interface PromptScore {
  overall: number;
  breakdown: PromptScoreBreakdown;
  summary: string;
}

export type SuggestionPriority = "high" | "medium" | "low";

export interface ImprovementSuggestion {
  title: string;
  description: string;
  priority: SuggestionPriority;
}

export interface OptimizationExplanation {
  summary: string;
  reasons: string[];
}

export interface OptimizedPrompt {
  providerId: string;
  agentId: string;
  taskId: SupportedTask;
  prompt: string;
  sections: string[];
  explanation: OptimizationExplanation;
  score: PromptScore;
  suggestions: ImprovementSuggestion[];
}
