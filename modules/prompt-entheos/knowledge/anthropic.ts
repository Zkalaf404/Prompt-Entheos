import type { ProviderKnowledge } from "@/modules/prompt-entheos/types/knowledge";

export const anthropicKnowledge: ProviderKnowledge = {
  providerId: "anthropic",
  summary:
    "Claude-oriented prompts benefit from rich context, explicit boundaries, and clearly separated instructions.",
  lastUpdated: "2026-04-18",
  sources: [
    {
      kind: "official-docs",
      title: "Anthropic Claude prompting guidance",
      status: "planned",
      notes:
        "Future ingestion target for official Claude prompting references and model guidance.",
    },
    {
      kind: "curated-rules",
      title: "Prompt Entheos Anthropic starter heuristics",
      status: "mock",
    },
  ],
  bestPractices: [
    "Separate the goal, context, and instructions cleanly.",
    "Give Claude enough background to reason well.",
    "Make boundaries and assumptions explicit.",
    "Define the final deliverable with minimal ambiguity.",
  ],
  formattingNotes: [
    "Use XML-like tags or clearly labeled sections.",
    "Group related instructions together.",
    "Keep the prompt thoughtful and high-context rather than overly terse.",
  ],
  antiPatterns: [
    "Compressed prompts with no structure",
    "Missing context for complex reasoning tasks",
    "Implicit expectations that should be stated directly",
  ],
  templates: [
    {
      title: "Claude XML template",
      template:
        "<role>...</role>\\n<goal>...</goal>\\n<context>...</context>\\n<instructions>...</instructions>\\n<constraints>...</constraints>\\n<output_format>...</output_format>",
      notes: ["Useful when the request benefits from clearly bounded sections."],
    },
  ],
  examples: [
    {
      title: "Research assistant prompt",
      rawInput: "Help me think through a product strategy",
      optimizedPrompt:
        "<goal>Evaluate a product strategy for...</goal><context>...</context>",
      notes: ["Adds structure and reasoning boundaries."],
    },
  ],
  taskGuidance: {
    "research-assistant": [
      "Clarify the lens for analysis and what tradeoffs matter.",
      "State whether the answer should compare, critique, or recommend.",
    ],
    "marketing-copy": [
      "Provide voice, audience, and format.",
      "Separate tone guidance from factual constraints.",
    ],
    "general-chat": [
      "Add context explicitly when the user expects nuance or careful tradeoff handling.",
      "Keep the goal and boundaries in separate sections.",
    ],
  },
};
