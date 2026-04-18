import type { ProviderId } from "@/modules/prompt-entheos/types/provider";
import type { SupportedTask } from "@/modules/prompt-entheos/types/task";

export const knowledgeSourceKinds = [
  "official-docs",
  "curated-rules",
  "internal-playbook",
  "examples",
] as const;

export type KnowledgeSourceKind = (typeof knowledgeSourceKinds)[number];

export interface KnowledgeSourceReference {
  kind: KnowledgeSourceKind;
  title: string;
  url?: string;
  status: "connected" | "planned" | "mock";
  notes?: string;
}

export interface ProviderExample {
  title: string;
  rawInput: string;
  optimizedPrompt: string;
  notes: string[];
}

export interface KnowledgeTemplate {
  title: string;
  taskId?: SupportedTask;
  template: string;
  notes: string[];
}

export type TaskGuidanceMap = Partial<Record<SupportedTask, string[]>>;

export interface ProviderKnowledge {
  providerId: ProviderId;
  summary: string;
  lastUpdated: string;
  sources: KnowledgeSourceReference[];
  bestPractices: string[];
  formattingNotes: string[];
  antiPatterns: string[];
  templates: KnowledgeTemplate[];
  examples: ProviderExample[];
  taskGuidance: TaskGuidanceMap;
}
