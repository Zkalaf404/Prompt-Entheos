import type { SupportedTask } from "@/modules/prompt-entheos/types/task";

export type { SupportedTask };

export const providerIds = [
  "openai",
  "anthropic",
  "gemini",
  "midjourney",
] as const;

export type ProviderId = (typeof providerIds)[number];

export const providerCategories = [
  "llm",
  "image",
  "video",
  "audio",
  "agent",
] as const;

export type ProviderCategory = (typeof providerCategories)[number];

export const providerStatuses = [
  "active",
  "beta",
  "planned",
  "deprecated",
] as const;

export type ProviderStatus = (typeof providerStatuses)[number];

export interface ProviderMetadata {
  id: ProviderId;
  agentId: string;
  name: string;
  aliases: string[];
  categories: ProviderCategory[];
  description: string;
  supportedTasks: SupportedTask[];
  status: ProviderStatus;
}
