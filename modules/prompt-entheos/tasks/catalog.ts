import type { TaskDefinition } from "@/modules/prompt-entheos/types";

export const taskCatalog: TaskDefinition[] = [
  {
    id: "general-chat",
    name: "General Chat",
    agentLabel: "general assistant response",
    description: "A clean, helpful general-purpose assistant answer.",
    typicalOutputs: ["answer", "assistant reply", "guided response"],
    detection: {
      aliases: ["general-chat", "chat", "conversation", "assistant", "reply"],
      patterns: [/chat|reply|conversation|assistant|رد|محادثة/iu],
      priority: 20,
    },
  },
  {
    id: "marketing-copy",
    name: "Marketing Copy",
    agentLabel: "marketing copy deliverable",
    description: "Marketing-oriented writing such as landing copy, emails, ads, and positioning.",
    typicalOutputs: ["campaign copy", "email draft", "landing page section"],
    detection: {
      aliases: ["marketing-copy", "marketing", "copy", "campaign", "ad", "email"],
      patterns: [/marketing|copy|campaign|email|landing|ad|brand|تسويق|إعلان|حملة/iu],
      priority: 70,
    },
  },
  {
    id: "research-assistant",
    name: "Research Assistant",
    agentLabel: "research assistant deliverable",
    description: "Structured research, synthesis, comparisons, and reasoning support.",
    typicalOutputs: ["research brief", "comparison", "analysis memo"],
    detection: {
      aliases: ["research-assistant", "research", "analysis", "compare", "summary"],
      patterns: [/research|analysis|compare|summary|strategy|brief|بحث|تحليل|قارن/iu],
      priority: 60,
    },
  },
  {
    id: "image-generation",
    name: "Image Generation",
    agentLabel: "image generation",
    description: "Visual prompt design for still-image generation systems.",
    typicalOutputs: ["image prompt", "scene description", "visual concept"],
    detection: {
      aliases: ["image-generation", "image", "midjourney", "illustration", "render"],
      patterns: [/midjourney|image|poster|render|shot|illustration|صورة|مشهد/iu],
      priority: 100,
    },
  },
];
