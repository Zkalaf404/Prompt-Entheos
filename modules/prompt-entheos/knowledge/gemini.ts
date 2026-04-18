import type { ProviderKnowledge } from "@/modules/prompt-entheos/types/knowledge";

export const geminiKnowledge: ProviderKnowledge = {
  providerId: "gemini",
  summary:
    "Gemini-oriented prompts improve when the goal, expected response shape, and quality checklist are clearly specified.",
  lastUpdated: "2026-04-18",
  sources: [
    {
      kind: "official-docs",
      title: "Google Gemini prompting guidance",
      status: "planned",
      notes:
        "Future ingestion target for Gemini docs, prompt patterns, and model-specific capabilities.",
    },
    {
      kind: "curated-rules",
      title: "Prompt Entheos Gemini starter heuristics",
      status: "mock",
    },
  ],
  bestPractices: [
    "Lead with the goal before the details.",
    "Define what a successful answer should include.",
    "Use short checklists to shape the response quality.",
    "Break multistep work into explicit expectations.",
  ],
  formattingNotes: [
    "Use clear labels such as Goal, Required response, and Quality bar.",
    "Keep the output request explicit and measurable.",
    "Avoid mixing the user's raw idea with hidden assumptions.",
  ],
  antiPatterns: [
    "Ambiguous expected output",
    "No quality rubric",
    "Too much context with no clear action",
  ],
  templates: [
    {
      title: "Gemini quality-bar template",
      template:
        "Goal:\\n[user goal]\\n\\nUser intent:\\n- [intent]\\n\\nRequired response:\\n- [deliverable]\\n\\nConstraints:\\n- [constraints]\\n\\nQuality bar:\\n- Clear\\n- Specific\\n- Useful",
      notes: ["Works well when the user needs response shaping and evaluation criteria."],
    },
  ],
  examples: [
    {
      title: "Strategy prompt",
      rawInput: "Give me ideas for a growth campaign",
      optimizedPrompt:
        "Goal: Create a growth campaign concept list. Required response: 5 ideas...",
      notes: ["Adds deliverable shape and quality bar."],
    },
  ],
  taskGuidance: {
    "marketing-copy": [
      "Specify the campaign goal, audience, and what action the copy should drive.",
      "Set a usefulness or conversion bar for the response.",
    ],
    "research-assistant": [
      "Clarify the output format and how much depth is needed.",
      "Add a lightweight quality checklist for the final answer.",
    ],
    "general-chat": [
      "Keep the goal explicit and the reply format simple.",
      "State whether the answer should be concise or more exploratory.",
    ],
  },
};
