import { anthropicAgent } from "@/modules/prompt-entheos/agents/anthropic-agent";
import { geminiAgent } from "@/modules/prompt-entheos/agents/gemini-agent";
import { midjourneyAgent } from "@/modules/prompt-entheos/agents/midjourney-agent";
import { openAIAgent } from "@/modules/prompt-entheos/agents/openai-agent";
import type { PromptAgent } from "@/modules/prompt-entheos/types";

const agents: PromptAgent[] = [
  openAIAgent,
  anthropicAgent,
  geminiAgent,
  midjourneyAgent,
];

const agentMap = new Map<string, PromptAgent>(
  agents.map((agent) => [agent.provider.id, agent]),
);
const agentIdMap = new Map<string, PromptAgent>(
  agents.map((agent) => [agent.id, agent]),
);

export function listAgents(): PromptAgent[] {
  return [...agents];
}

export function getAgentByProviderId(providerId: string): PromptAgent | undefined {
  return agentMap.get(providerId);
}

export function getAgentById(agentId: string): PromptAgent | undefined {
  return agentIdMap.get(agentId);
}
