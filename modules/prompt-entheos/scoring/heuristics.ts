import type { ProviderKnowledge } from "@/modules/prompt-entheos/types/knowledge";
import type { PromptInput, PromptScore } from "@/modules/prompt-entheos/types/prompt";
import type { ProviderMetadata } from "@/modules/prompt-entheos/types/provider";

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function containsAny(text: string, keywords: string[]): boolean {
  return keywords.some((keyword) => text.includes(keyword));
}

function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

function scoreClarity(text: string): number {
  const words = countWords(text);

  if (words < 8) {
    return 48;
  }

  if (words < 20) {
    return 66;
  }

  if (words < 120) {
    return 84;
  }

  return 76;
}

function scoreStructure(text: string): number {
  const lineBreaks = (text.match(/\n/g) ?? []).length;
  const labeledSections = (text.match(/^[A-Za-z<][^:\n>]*:?/gm) ?? []).length;

  return clampScore(42 + lineBreaks * 5 + labeledSections * 8);
}

function scoreSpecificity(text: string): number {
  const specificitySignals = [
    ":",
    "audience",
    "tone",
    "format",
    "constraints",
    "context",
    "criteria",
    "style",
    "lighting",
    "composition",
    "--ar",
    "--stylize",
    "الجمهور",
    "الأسلوب",
    "الصيغة",
    "القيود",
  ];

  const signalCount = specificitySignals.filter((signal) =>
    text.toLowerCase().includes(signal),
  ).length;

  return clampScore(50 + signalCount * 6);
}

function scoreConstraintCoverage(text: string, input?: Partial<PromptInput>): number {
  const explicitConstraints = input?.constraints?.length ?? 0;
  const promptSignals = [
    "constraints",
    "requirements",
    "must",
    "avoid",
    "return",
    "القيود",
    "المطلوب",
    "تجنب",
  ];

  const promptHits = promptSignals.filter((signal) =>
    text.toLowerCase().includes(signal),
  ).length;

  return clampScore(40 + explicitConstraints * 12 + promptHits * 5);
}

function scoreProviderFit(
  text: string,
  provider: ProviderMetadata,
  knowledge: ProviderKnowledge,
): number {
  const normalizedText = text.toLowerCase();
  let score = 40;

  if (provider.id === "openai") {
    if (containsAny(normalizedText, ["role:", "objective:", "output format:"])) {
      score += 28;
    }
  }

  if (provider.id === "anthropic") {
    if (containsAny(normalizedText, ["<goal>", "<context>", "<output_format>"])) {
      score += 30;
    }
  }

  if (provider.id === "gemini") {
    if (containsAny(normalizedText, ["goal:", "required response:", "quality bar:"])) {
      score += 28;
    }
  }

  if (provider.id === "midjourney") {
    if (containsAny(normalizedText, ["--ar", "--stylize", "--quality", "--q"])) {
      score += 26;
    }

    if ((text.match(/,/g) ?? []).length >= 3) {
      score += 14;
    }
  }

  score += Math.min(knowledge.bestPractices.length * 3, 12);

  return clampScore(score);
}

export function scorePromptForProvider(
  prompt: string,
  provider: ProviderMetadata,
  knowledge: ProviderKnowledge,
  input?: Partial<PromptInput>,
): PromptScore {
  const clarity = scoreClarity(prompt);
  const structure = scoreStructure(prompt);
  const specificity = scoreSpecificity(prompt);
  const providerFit = scoreProviderFit(prompt, provider, knowledge);
  const constraintCoverage = scoreConstraintCoverage(prompt, input);
  const overall = clampScore(
    clarity * 0.22 +
      structure * 0.22 +
      specificity * 0.2 +
      providerFit * 0.22 +
      constraintCoverage * 0.14,
  );

  return {
    overall,
    breakdown: {
      clarity,
      structure,
      specificity,
      providerFit,
      constraintCoverage,
    },
    summary:
      overall >= 80
        ? "Strong provider fit with clear structure and useful constraints."
        : "Usable foundation, but more specificity or structure would improve the prompt.",
  };
}
