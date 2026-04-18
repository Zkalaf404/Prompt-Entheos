import { resolveTaskByTerm } from "@/modules/prompt-entheos/tasks/registry";
import type { NormalizedPromptInput, PromptPipelineInput } from "@/modules/prompt-entheos/types";

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function dedupeConstraints(constraints: string[]): string[] {
  return [...new Set(constraints.map(normalizeWhitespace).filter(Boolean))];
}

function detectLanguage(rawPrompt: string, explicitLanguage?: string): string {
  if (explicitLanguage?.trim()) {
    return explicitLanguage.trim().toLowerCase();
  }

  if (/[\u0600-\u06FF]/u.test(rawPrompt)) {
    return "ar";
  }

  return "en";
}

function normalizeTask(value?: PromptPipelineInput["task"]): NormalizedPromptInput["task"] {
  if (!value) {
    return undefined;
  }

  return resolveTaskByTerm(value)?.id;
}

function normalizeProvider(
  input: PromptPipelineInput,
): NormalizedPromptInput["provider"] {
  const providerTerm = input.provider ?? input.providerId;
  return providerTerm ? normalizeWhitespace(providerTerm) : undefined;
}

export function normalizePromptInput(input: PromptPipelineInput): NormalizedPromptInput {
  return {
    rawPrompt: normalizeWhitespace(input.rawPrompt),
    context: input.context ? normalizeWhitespace(input.context) : undefined,
    brandContext: input.brandContext,
    provider: normalizeProvider(input),
    targetHint: input.targetHint ? normalizeWhitespace(input.targetHint) : undefined,
    task: normalizeTask(input.task ?? input.requestedTask),
    language: detectLanguage(input.rawPrompt, input.language),
    constraints: dedupeConstraints(input.constraints ?? []),
  };
}
