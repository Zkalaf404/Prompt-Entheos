import type { ProviderKnowledge } from "@/modules/prompt-entheos/types/knowledge";

export const midjourneyKnowledge: ProviderKnowledge = {
  providerId: "midjourney",
  summary:
    "Midjourney prompts work best as concise visual instructions with a clear subject, scene, style, and parameters.",
  lastUpdated: "2026-04-18",
  sources: [
    {
      kind: "official-docs",
      title: "Midjourney prompting references",
      status: "planned",
      notes:
        "Future ingestion target for official and curated prompt syntax, parameter rules, and examples.",
    },
    {
      kind: "curated-rules",
      title: "Prompt Entheos Midjourney starter heuristics",
      status: "mock",
    },
  ],
  bestPractices: [
    "Anchor the prompt with a specific visual subject.",
    "Add scene, composition, lighting, and style cues.",
    "Use concise descriptive phrases rather than long instructions.",
    "Keep parameters at the end of the prompt.",
  ],
  formattingNotes: [
    "Prefer comma-separated descriptors.",
    "Add aspect ratio and stylization parameters when helpful.",
    "Avoid chatty or explanatory language inside the image prompt.",
  ],
  antiPatterns: [
    "Abstract prompts with no visual anchor",
    "Too much prose",
    "Missing composition or style direction",
  ],
  templates: [
    {
      title: "Midjourney visual stack",
      taskId: "image-generation",
      template:
        "[subject], [environment], [composition], [lighting], [style] --ar [ratio] --stylize [value]",
      notes: ["Keep the parameter block at the end."],
    },
  ],
  examples: [
    {
      title: "Concept art prompt",
      rawInput: "A futuristic city at sunset",
      optimizedPrompt:
        "futuristic city skyline at sunset, cinematic lighting, layered atmosphere --ar 16:9",
      notes: ["Adds visual specificity and a usable parameter."],
    },
  ],
  taskGuidance: {
    "image-generation": [
      "Describe what should be seen, not how a chatbot should behave.",
      "Choose parameters that match the intended framing.",
    ],
  },
};
