import { createPromptAgent } from "@/modules/prompt-entheos/agents/helpers";
import { anthropicKnowledge } from "@/modules/prompt-entheos/knowledge/anthropic";
import { requireProvider } from "@/modules/prompt-entheos/providers/registry";

const anthropicProvider = requireProvider("anthropic");

export const anthropicAgent = createPromptAgent({
  provider: anthropicProvider,
  knowledge: anthropicKnowledge,
  optimizePrompt(input, helpers) {
    const analysis = helpers.analyzeInput(input);
    const constraints = input.constraints?.length
      ? input.constraints
      : [
          "Stay faithful to the user's goal.",
          "Be thoughtful and well-structured.",
          "State assumptions only when they materially help.",
        ];
    const brandContextLines = helpers.getBrandContextLines(
      input.brandContext,
      input.promptContextPack,
    );

    const prompt = [
      "<role>",
      `You are a specialist assistant for ${helpers.getTaskLabel(analysis.detectedTask)}.`,
      "</role>",
      "",
      "<goal>",
      analysis.normalizedPrompt,
      "</goal>",
      "",
      "<context>",
      "- Preserve the user's original intent.",
      "- Use enough context and nuance to make the answer high quality.",
      "- Keep the final response organized and easy to review.",
      "</context>",
      ...(brandContextLines.length > 0
        ? [
            "",
            "<brand_context>",
            ...brandContextLines.map((line) => `- ${line}`),
            "</brand_context>",
          ]
        : []),
      "",
      "<instructions>",
      "- Think through the task carefully before finalizing the answer.",
      "- Keep reasoning grounded in the given request.",
      "- Avoid over-answering beyond the user's scope.",
      "</instructions>",
      "",
      "<constraints>",
      ...constraints.map((item) => `- ${item}`),
      "</constraints>",
      "",
      "<output_format>",
      "- Return a polished final answer.",
      "- Use headings or bullets if they improve clarity.",
      "- Keep the response coherent, useful, and actionable.",
      "</output_format>",
    ].join("\n");

    return helpers.buildResult(
      input,
      prompt,
      ["<role>", "<goal>", "<context>", "<instructions>", "<constraints>", "<output_format>"],
      [
        "The prompt now uses clear Claude-friendly boundaries instead of mixed instructions.",
        "It increases context density without becoming noisy.",
        "It makes the response requirements and boundaries easier for the model to follow.",
      ],
    );
  },
});
