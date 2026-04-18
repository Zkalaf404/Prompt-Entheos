import type { ProviderMetadata } from "@/modules/prompt-entheos/types/provider";

export const providerCatalog: ProviderMetadata[] = [
  {
    id: "openai",
    agentId: "openai-agent",
    name: "OpenAI",
    aliases: ["chatgpt", "gpt", "open ai"],
    categories: ["llm", "agent"],
    description:
      "Specialist for ChatGPT and OpenAI models with structured, explicit instruction design.",
    supportedTasks: [
      "general-chat",
      "marketing-copy",
      "research-assistant",
    ],
    status: "active",
  },
  {
    id: "anthropic",
    agentId: "anthropic-agent",
    name: "Anthropic Claude",
    aliases: ["claude", "anthropic claude", "anthropic"],
    categories: ["llm", "agent"],
    description:
      "Specialist for Claude-style prompts with rich context, careful boundaries, and clearly marked sections.",
    supportedTasks: [
      "general-chat",
      "marketing-copy",
      "research-assistant",
    ],
    status: "active",
  },
  {
    id: "gemini",
    agentId: "gemini-agent",
    name: "Google Gemini",
    aliases: ["gemini", "google", "google gemini", "bard"],
    categories: ["llm", "agent"],
    description:
      "Specialist for Gemini-oriented prompts with explicit goals, response requirements, and evaluation criteria.",
    supportedTasks: [
      "general-chat",
      "marketing-copy",
      "research-assistant",
    ],
    status: "active",
  },
  {
    id: "midjourney",
    agentId: "midjourney-agent",
    name: "Midjourney",
    aliases: ["mj", "mid journey", "midjourney prompt"],
    categories: ["image"],
    description:
      "Specialist for Midjourney prompt syntax with visual specificity, scene design, and parameter-aware phrasing.",
    supportedTasks: ["image-generation"],
    status: "active",
  },
];
