import type { NormalizedBrandContext } from "@/modules/prompt-entheos/types/brand";
import { scorePromptForProvider } from "@/modules/prompt-entheos/scoring/heuristics";
import { getTaskById } from "@/modules/prompt-entheos/tasks/registry";
import type { PromptAgent, PromptAgentInput } from "@/modules/prompt-entheos/types/agent";
import type { ProviderKnowledge } from "@/modules/prompt-entheos/types/knowledge";
import type {
  ImprovementSuggestion,
  OptimizationExplanation,
  OptimizedPrompt,
  PromptAnalysis,
  PromptLength,
} from "@/modules/prompt-entheos/types/prompt";
import type { ProviderMetadata } from "@/modules/prompt-entheos/types/provider";
import type { SupportedTask } from "@/modules/prompt-entheos/types/task";

export interface PromptAgentHelpers {
  analyzeInput(input: PromptAgentInput): PromptAnalysis;
  buildSectionPrompt(
    sections: Array<{ label: string; content: string | string[] }>,
  ): { prompt: string; labels: string[] };
  buildResult(
    input: PromptAgentInput,
    prompt: string,
    sections: string[],
    reasons: string[],
  ): OptimizedPrompt;
  getBrandContextLines(brandContext?: NormalizedBrandContext): string[];
  getBrandDescriptors(brandContext?: NormalizedBrandContext): string[];
  getTaskLabel(task: SupportedTask): string;
  normalizeText(value: string): string;
}

interface PromptAgentFactoryConfig {
  provider: ProviderMetadata;
  knowledge: ProviderKnowledge;
  optimizePrompt(input: PromptAgentInput, helpers: PromptAgentHelpers): OptimizedPrompt;
}

function detectPromptLength(wordCount: number): PromptLength {
  if (wordCount < 18) {
    return "short";
  }

  if (wordCount < 65) {
    return "medium";
  }

  return "long";
}

function normalizeText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function hasAudienceCue(text: string): boolean {
  return /audience|customer|reader|founder|team|الجمهور|للعملاء|للفريق/u.test(text);
}

function hasOutputCue(text: string): boolean {
  return /output|format|list|table|post|email|prompt|صيغة|قائمة|جدول|منشور/u.test(text);
}

function hasContextCue(text: string): boolean {
  return /for|about|context|because|launch|campaign|project|حول|سياق|مشروع|حملة/u.test(text);
}

export function analyzePromptInput(
  provider: ProviderMetadata,
  input: PromptAgentInput,
): PromptAnalysis {
  const normalizedPrompt = normalizeText(input.rawPrompt);
  const words = normalizedPrompt.split(/\s+/).filter(Boolean);
  const promptLength = detectPromptLength(words.length);
  const strengths: string[] = [];
  const issues: string[] = [];
  const missingContext: string[] = [];

  if (words.length >= 10) {
    strengths.push("The raw prompt already carries enough signal to preserve intent.");
  } else {
    issues.push("The raw prompt is short and may be missing important context.");
  }

  if (input.constraints?.length) {
    strengths.push("Explicit constraints are already present.");
  } else {
    missingContext.push("constraints");
  }

  if (hasAudienceCue(normalizedPrompt)) {
    strengths.push("Audience intent is at least partially implied.");
  } else {
    missingContext.push("audience");
  }

  if (hasOutputCue(normalizedPrompt)) {
    strengths.push("The expected deliverable is partially visible.");
  } else {
    missingContext.push("output format");
  }

  if (!hasContextCue(normalizedPrompt)) {
    missingContext.push("business or task context");
  }

  return {
    normalizedPrompt,
    detectedTask: input.task,
    promptLength,
    strengths,
    issues,
    missingContext,
  };
}

function buildSectionPrompt(
  sections: Array<{ label: string; content: string | string[] }>,
): { prompt: string; labels: string[] } {
  const prompt = sections
    .filter((section) =>
      Array.isArray(section.content)
        ? section.content.filter(Boolean).length > 0
        : section.content.trim().length > 0,
    )
    .map((section) => {
      if (Array.isArray(section.content)) {
        const bullets = section.content.map((line) => `- ${line}`).join("\n");
        return `${section.label}:\n${bullets}`;
      }

      return `${section.label}:\n${section.content}`;
    })
    .join("\n\n");

  return {
    prompt,
    labels: sections.map((section) => section.label),
  };
}

function buildExplanation(providerName: string, reasons: string[]): OptimizationExplanation {
  return {
    summary: `Optimized for ${providerName} with stronger structure, clearer task framing, and better provider fit.`,
    reasons,
  };
}

function getBrandContextLines(
  brandContext?: NormalizedBrandContext,
): string[] {
  if (!brandContext) {
    return [];
  }

  return [...brandContext.contextLines];
}

function getBrandDescriptors(
  brandContext?: NormalizedBrandContext,
): string[] {
  if (!brandContext) {
    return [];
  }

  return [
    `${brandContext.name} brand direction`,
    `${brandContext.tone} tone`,
    `appeals to ${brandContext.audience}`,
    brandContext.description,
  ]
    .map(normalizeText)
    .filter(Boolean);
}

function suggestImprovements(
  provider: ProviderMetadata,
  knowledge: ProviderKnowledge,
  input: PromptAgentInput,
): ImprovementSuggestion[] {
  const analysis = analyzePromptInput(provider, input);
  const suggestions: ImprovementSuggestion[] = [];

  if (analysis.missingContext.includes("audience")) {
    suggestions.push({
      title: "Add audience context",
      description:
        "State who the output is for so the agent can choose the right voice and detail level.",
      priority: "high",
    });
  }

  if (analysis.missingContext.includes("output format")) {
    suggestions.push({
      title: "Define the output format",
      description:
        "Specify whether you want bullets, prose, a table, a list of prompts, or a one-line generation prompt.",
      priority: "high",
    });
  }

  if (analysis.missingContext.includes("constraints")) {
    suggestions.push({
      title: "State constraints explicitly",
      description:
        "Mention tone, length, platform rules, or anything the final output must avoid or include.",
      priority: "medium",
    });
  }

  const antiPattern = knowledge.antiPatterns[0];
  if (antiPattern) {
    suggestions.push({
      title: "Avoid common anti-patterns",
      description: `For ${provider.name}, avoid ${antiPattern.toLowerCase()}.`,
      priority: "medium",
    });
  }

  return suggestions.slice(0, 4);
}

export function getTaskLabel(task: SupportedTask): string {
  return getTaskById(task).agentLabel;
}

export function createPromptAgent(config: PromptAgentFactoryConfig): PromptAgent {
  const analyzeInput = (input: PromptAgentInput) => analyzePromptInput(config.provider, input);
  const improvementSuggestions = (input: PromptAgentInput) =>
    suggestImprovements(config.provider, config.knowledge, input);
  const helpers: PromptAgentHelpers = {
    analyzeInput,
    buildSectionPrompt,
    buildResult: (input, prompt, sections, reasons) => ({
      providerId: config.provider.id,
      agentId: config.provider.agentId,
      taskId: input.task,
      prompt,
      sections,
      explanation: buildExplanation(config.provider.name, reasons),
      score: scorePromptForProvider(prompt, config.provider, config.knowledge, {
        rawPrompt: input.rawPrompt,
        constraints: input.constraints,
        requestedTask: input.task,
        language: input.language,
      }),
      suggestions: improvementSuggestions(input),
    }),
    getBrandContextLines,
    getBrandDescriptors,
    getTaskLabel,
    normalizeText,
  };

  return {
    id: config.provider.agentId,
    provider: config.provider,
    knowledge: config.knowledge,
    optimize: (input) => config.optimizePrompt(input, helpers),
  };
}
