import { providerCatalog } from "@/modules/prompt-entheos/providers/catalog";
import type { ProviderMetadata } from "@/modules/prompt-entheos/types/provider";

export interface ProviderSearchResult {
  provider: ProviderMetadata;
  matchedTerm: string;
  score: number;
}

const providerMap = new Map<string, ProviderMetadata>(
  providerCatalog.map((provider) => [provider.id, provider]),
);
const providerAliasMap = new Map<string, ProviderMetadata>(
  providerCatalog.flatMap((provider) =>
    [provider.id, provider.name, ...provider.aliases].map((alias) => [
      normalizeProviderTerm(alias),
      provider,
    ]),
  ),
);

export function normalizeProviderTerm(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function collectSearchTerms(provider: ProviderMetadata): string[] {
  return [provider.id, provider.name, ...provider.aliases].map(normalizeProviderTerm);
}

function scoreProviderTerm(query: string, term: string): number {
  if (!query || !term) {
    return 0;
  }

  if (query === term) {
    return 100;
  }

  if (term.includes(query) || query.includes(term)) {
    return 82;
  }

  const queryTokens = new Set(query.split(" "));
  const termTokens = new Set(term.split(" "));
  const overlap = [...queryTokens].filter((token) => termTokens.has(token)).length;

  if (!overlap) {
    return 0;
  }

  return Math.round((overlap / Math.max(queryTokens.size, termTokens.size)) * 70);
}

export function listProviders(): ProviderMetadata[] {
  return [...providerCatalog];
}

export function listActiveProviders(): ProviderMetadata[] {
  return providerCatalog.filter((provider) => provider.status === "active");
}

export function getProviderById(providerId: string): ProviderMetadata | undefined {
  return providerMap.get(providerId);
}

export function resolveProviderAlias(alias: string): ProviderMetadata | undefined {
  const normalizedAlias = normalizeProviderTerm(alias);

  if (!normalizedAlias) {
    return undefined;
  }

  return providerAliasMap.get(normalizedAlias);
}

export function requireProvider(providerId: string): ProviderMetadata {
  const provider = getProviderById(providerId);

  if (!provider) {
    throw new Error(`Provider "${providerId}" is missing from the registry.`);
  }

  return provider;
}

export function searchProviders(term: string): ProviderSearchResult[] {
  const normalizedTerm = normalizeProviderTerm(term);

  if (!normalizedTerm) {
    return [];
  }

  const exactMatch = resolveProviderAlias(normalizedTerm);

  if (exactMatch) {
    return [
      {
        provider: exactMatch,
        matchedTerm: normalizedTerm,
        score: 100,
      },
    ];
  }

  return providerCatalog
    .map((provider) => {
      const scoredTerms = collectSearchTerms(provider)
        .map((candidate) => ({
          matchedTerm: candidate,
          score: scoreProviderTerm(normalizedTerm, candidate),
        }))
        .sort((left, right) => right.score - left.score);

      return {
        provider,
        matchedTerm: scoredTerms[0]?.matchedTerm ?? provider.id,
        score: scoredTerms[0]?.score ?? 0,
      };
    })
    .filter((result) => result.score > 0)
    .sort((left, right) => right.score - left.score);
}

export function suggestProviders(term: string, limit = 3): ProviderMetadata[] {
  const matches = searchProviders(term)
    .slice(0, limit)
    .map((match) => match.provider);

  if (matches.length > 0) {
    return matches;
  }

  return listActiveProviders().slice(0, limit);
}
