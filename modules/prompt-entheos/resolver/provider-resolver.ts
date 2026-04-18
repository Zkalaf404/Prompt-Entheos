import { getAgentByProviderId } from "@/modules/prompt-entheos/agents/registry";
import {
  normalizeProviderTerm,
  resolveProviderAlias,
  suggestProviders,
} from "@/modules/prompt-entheos/providers/registry";
import type { PromptAgent, ProviderMetadata } from "@/modules/prompt-entheos/types";

export interface ProviderResolverInput {
  provider?: string;
  providerId?: string;
  targetHint?: string;
  rawPrompt?: string;
}

export interface ProviderResolution {
  matched: boolean;
  confidence: "high" | "medium" | "low";
  provider?: ProviderMetadata;
  agent?: PromptAgent;
  matchedBy: "provider" | "provider-id" | "target-hint" | "raw-prompt" | "fallback";
  matchedAlias?: string;
  reason: string;
  suggestions: ProviderMetadata[];
}

function findProviderMention(
  text: string,
): { provider: ProviderMetadata; matchedAlias: string } | null {
  const normalizedText = normalizeProviderTerm(text);

  if (!normalizedText) {
    return null;
  }

  for (const provider of suggestProviders(normalizedText, 4)) {
    for (const alias of [provider.id, provider.name, ...provider.aliases]) {
      const normalizedAlias = normalizeProviderTerm(alias);

      if (normalizedAlias && normalizedText.includes(normalizedAlias)) {
        return {
          provider,
          matchedAlias: normalizedAlias,
        };
      }
    }
  }

  return null;
}

export function resolveProvider(input: ProviderResolverInput): ProviderResolution {
  if (input.provider) {
    const provider = resolveProviderAlias(input.provider);

    if (provider) {
      return {
        matched: true,
        confidence: "high",
        provider,
        agent: getAgentByProviderId(provider.id),
        matchedBy: "provider",
        matchedAlias: normalizeProviderTerm(input.provider),
        reason: "Matched the explicit provider alias from the request.",
        suggestions: [],
      };
    }
  }

  if (input.providerId) {
    const provider = resolveProviderAlias(input.providerId);

    if (provider) {
      return {
        matched: true,
        confidence: "high",
        provider,
        agent: getAgentByProviderId(provider.id),
        matchedBy: "provider-id",
        matchedAlias: provider.id,
        reason: "Matched an explicit provider id from the request.",
        suggestions: [],
      };
    }
  }

  if (input.targetHint) {
    const provider = resolveProviderAlias(input.targetHint);

    if (provider) {
      return {
        matched: true,
        confidence: "high",
        provider,
        agent: getAgentByProviderId(provider.id),
        matchedBy: "target-hint",
        matchedAlias: normalizeProviderTerm(input.targetHint),
        reason: "Matched the provider using an explicit target hint or alias.",
        suggestions: [],
      };
    }
  }

  if (input.rawPrompt) {
    const mention = findProviderMention(input.rawPrompt);

    if (mention) {
      return {
        matched: true,
        confidence: "medium",
        provider: mention.provider,
        agent: getAgentByProviderId(mention.provider.id),
        matchedBy: "raw-prompt",
        matchedAlias: mention.matchedAlias,
        reason: "Detected a provider mention inside the raw prompt text.",
        suggestions: [],
      };
    }
  }

  const suggestionSeed = input.provider ?? input.targetHint ?? input.rawPrompt ?? "";

  return {
    matched: false,
    confidence: "low",
    matchedBy: "fallback",
    reason:
      "No supported provider was matched confidently. Suggesting the closest active providers instead.",
    suggestions: suggestProviders(suggestionSeed),
  };
}

export function resolveAgent(input: ProviderResolverInput): ProviderResolution {
  const resolution = resolveProvider(input);

  if (resolution.provider && !resolution.agent) {
    return {
      ...resolution,
      matched: false,
      confidence: "low",
      reason:
        "A provider record exists, but there is no registered agent for it yet. Add the agent to agents/registry.ts.",
      suggestions: suggestProviders(resolution.provider.name),
    };
  }

  return resolution;
}
