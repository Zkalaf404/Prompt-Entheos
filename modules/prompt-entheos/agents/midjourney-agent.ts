import { createPromptAgent } from "@/modules/prompt-entheos/agents/helpers";
import { midjourneyKnowledge } from "@/modules/prompt-entheos/knowledge/midjourney";
import { requireProvider } from "@/modules/prompt-entheos/providers/registry";

const midjourneyProvider = requireProvider("midjourney");

function stripKnownParameters(prompt: string): string {
  return prompt
    .replace(/--ar\s+\S+/gi, "")
    .replace(/--stylize\s+\S+/gi, "")
    .replace(/--quality\s+\S+/gi, "")
    .replace(/--q\s+\S+/gi, "")
    .replace(/\s+/g, " ")
    .replace(/\s+,/g, ",")
    .trim();
}

function inferAspectRatio(prompt: string): string {
  const normalized = prompt.toLowerCase();

  if (/portrait|poster|phone|vertical|عمودي|بورتريه/u.test(normalized)) {
    return "--ar 2:3";
  }

  if (/cinematic|landscape|wide|banner|youtube|مشهد|سينمائي/u.test(normalized)) {
    return "--ar 16:9";
  }

  return "--ar 1:1";
}

export const midjourneyAgent = createPromptAgent({
  provider: midjourneyProvider,
  knowledge: midjourneyKnowledge,
  optimizePrompt(input, helpers) {
    const cleanedPrompt = stripKnownParameters(helpers.normalizeText(input.rawPrompt));
    const hasAspectRatio = /--ar\s+\S+/i.test(input.rawPrompt);
    const hasStylize = /--stylize\s+\S+/i.test(input.rawPrompt);
    const hasQuality = /--quality\s+\S+|--q\s+\S+/i.test(input.rawPrompt);

    const descriptors = [
      cleanedPrompt,
      ...helpers.getBrandDescriptors(input.brandContext, input.promptContextPack),
      "clear focal subject",
      "layered composition",
      "cinematic lighting",
      "rich detail",
      "cohesive color palette",
    ];

    const parameters = [
      hasAspectRatio ? null : inferAspectRatio(cleanedPrompt),
      hasStylize ? null : "--stylize 150",
      hasQuality ? null : "--quality 1",
    ].filter(Boolean);

    const prompt = `${descriptors.filter(Boolean).join(", ")} ${parameters.join(" ")}`
      .replace(/\s+/g, " ")
      .trim();

    return helpers.buildResult(input, prompt, ["subject", "scene", "style", "parameters"], [
      "The rewritten prompt converts the raw idea into visual descriptors instead of conversational instructions.",
      "It adds scene-building cues like composition, lighting, and detail.",
      "It appends practical Midjourney parameters in a clean trailing block.",
    ]);
  },
});
