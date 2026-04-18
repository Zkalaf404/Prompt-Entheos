import type { ProviderKnowledge } from "@/modules/prompt-entheos/types/knowledge";

export const openAIKnowledge: ProviderKnowledge = {
  providerId: "openai",
  summary:
    "OpenAI prompts work best when the task, context, constraints, and target output format are explicit and ordered clearly.",
  lastUpdated: "2026-04-18",
  sources: [
    {
      kind: "official-docs",
      title: "OpenAI prompting guides",
      status: "planned",
      notes:
        "Future ingestion target for official prompting documentation and model-specific best practices.",
    },
    {
      kind: "curated-rules",
      title: "Prompt Entheos OpenAI starter heuristics",
      status: "mock",
    },
  ],
  bestPractices: [
    "Put the main instruction before secondary guidance.",
    "Explicitly state the desired deliverable and output format.",
    "Use short, non-conflicting constraints.",
    "Add success criteria when quality matters.",
  ],
  formattingNotes: [
    "Prefer labeled sections such as Role, Objective, Constraints, and Output format.",
    "Use bullet lists for requirements and evaluation criteria.",
    "Keep the prompt readable instead of packing everything into one paragraph.",
  ],
  antiPatterns: [
    "Vague requests with no target outcome",
    "Too many mixed instructions in one paragraph",
    "Missing format requirements",
  ],
  templates: [
    {
      title: "Structured execution prompt",
      template:
        "Role:\\nYou are an expert assistant for [task].\\n\\nObjective:\\n[user goal]\\n\\nContext:\\n- [business or user context]\\n\\nConstraints:\\n- [constraints]\\n\\nOutput format:\\n- [desired format]",
      notes: ["Strong default for writing, coding, and analysis work."],
    },
  ],
  examples: [
    {
      title: "Marketing rewrite",
      rawInput: "Write better launch copy for my SaaS",
      optimizedPrompt:
        "Role: You are a senior SaaS copywriter. Objective: Write launch copy for...",
      notes: ["Adds role, audience, and desired deliverable."],
    },
  ],
  taskGuidance: {
    "marketing-copy": [
      "Specify audience, tone, and call to action.",
      "Ask for structure before stylistic polish.",
    ],
    "research-assistant": [
      "Clarify the research question, lens, and decision the answer should support.",
      "Ask for structure before detail if the output needs to be easy to scan.",
    ],
    "general-chat": [
      "State the desired answer shape when tone or structure matters.",
      "Add important constraints directly instead of implying them.",
    ],
  },
};
