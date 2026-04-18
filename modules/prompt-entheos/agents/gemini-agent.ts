import { createPromptAgent } from "@/modules/prompt-entheos/agents/helpers";
import { geminiKnowledge } from "@/modules/prompt-entheos/knowledge/gemini";
import { requireProvider } from "@/modules/prompt-entheos/providers/registry";

const geminiProvider = requireProvider("gemini");

export const geminiAgent = createPromptAgent({
  provider: geminiProvider,
  knowledge: geminiKnowledge,
  optimizePrompt(input, helpers) {
    const analysis = helpers.analyzeInput(input);
    const constraints = input.constraints?.length
      ? input.constraints
      : [
          "Keep the answer practical and clearly structured.",
          "Stay close to the user's real intent.",
          "Avoid generic filler.",
        ];

    const built = helpers.buildSectionPrompt([
      {
        label: "Goal",
        content: analysis.normalizedPrompt,
      },
      {
        label: "User intent",
        content: [
          "Interpret the request faithfully before answering.",
          "Preserve the original business or creative objective.",
        ],
      },
      {
        label: "Brand context",
        content: helpers.getBrandContextLines(input.brandContext),
      },
      {
        label: "Required response",
        content: [
          `Produce a strong ${helpers.getTaskLabel(analysis.detectedTask)} result.`,
          "Organize the answer in a way that is easy to scan.",
          "Include only the information needed to complete the request well.",
        ],
      },
      {
        label: "Constraints",
        content: constraints,
      },
      {
        label: "Quality bar",
        content: [
          "Clear",
          "Specific",
          "Useful",
          "Consistent with the requested task",
        ],
      },
    ]);

    return helpers.buildResult(input, built.prompt, built.labels, [
      "The prompt now makes the goal and required deliverable explicit.",
      "It gives Gemini a lightweight quality checklist to optimize against.",
      "It removes ambiguity about what a successful answer should look like.",
    ]);
  },
});
