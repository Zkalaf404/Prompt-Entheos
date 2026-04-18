import { createPromptAgent } from "@/modules/prompt-entheos/agents/helpers";
import { openAIKnowledge } from "@/modules/prompt-entheos/knowledge/openai";
import { requireProvider } from "@/modules/prompt-entheos/providers/registry";

const openAIProvider = requireProvider("openai");

export const openAIAgent = createPromptAgent({
  provider: openAIProvider,
  knowledge: openAIKnowledge,
  optimizePrompt(input, helpers) {
    const analysis = helpers.analyzeInput(input);
    const constraints = input.constraints?.length
      ? input.constraints
      : [
          "Preserve the user's original intent.",
          "Be specific and actionable.",
          "Avoid filler and generic phrasing.",
        ];

    const built = helpers.buildSectionPrompt([
      {
        label: "Role",
        content: `You are an expert assistant for ${helpers.getTaskLabel(analysis.detectedTask)}.`,
      },
      {
        label: "Objective",
        content: analysis.normalizedPrompt,
      },
      {
        label: "Context",
        content: [
          "Keep the response tightly aligned with the user's goal.",
          "Infer missing details only when needed and state assumptions briefly.",
        ],
      },
      {
        label: "Brand context",
        content: helpers.getBrandContextLines(input.brandContext),
      },
      {
        label: "Constraints",
        content: constraints,
      },
      {
        label: "Output format",
        content: [
          "Return a polished final answer.",
          "Use headings or bullets when they improve readability.",
          "Make the result easy to scan and directly usable.",
        ],
      },
      {
        label: "Success criteria",
        content: [
          "High clarity",
          "Concrete detail",
          "Faithful to the original request",
        ],
      },
    ]);

    return helpers.buildResult(input, built.prompt, built.labels, [
      "The rewritten prompt uses explicit sections that OpenAI-style models respond to well.",
      "It separates the goal from the constraints and output requirements.",
      "It adds success criteria so the model has a clearer quality target.",
    ]);
  },
});
