import { anthropicKnowledge } from "@/modules/prompt-entheos/knowledge/anthropic";
import { geminiKnowledge } from "@/modules/prompt-entheos/knowledge/gemini";
import { midjourneyKnowledge } from "@/modules/prompt-entheos/knowledge/midjourney";
import { openAIKnowledge } from "@/modules/prompt-entheos/knowledge/openai";
import type { ProviderKnowledge } from "@/modules/prompt-entheos/types";
import type { ProviderId } from "@/modules/prompt-entheos/types/provider";

const knowledgeRegistry: ProviderKnowledge[] = [
  openAIKnowledge,
  anthropicKnowledge,
  geminiKnowledge,
  midjourneyKnowledge,
];

const knowledgeMap = new Map(
  knowledgeRegistry.map((knowledge) => [knowledge.providerId, knowledge]),
);

export function listProviderKnowledge(): ProviderKnowledge[] {
  return [...knowledgeRegistry];
}

export function getProviderKnowledge(
  providerId: ProviderId,
): ProviderKnowledge | undefined {
  return knowledgeMap.get(providerId);
}

export function requireProviderKnowledge(providerId: ProviderId): ProviderKnowledge {
  const knowledge = getProviderKnowledge(providerId);

  if (!knowledge) {
    throw new Error(`Provider knowledge for "${providerId}" is missing.`);
  }

  return knowledge;
}
