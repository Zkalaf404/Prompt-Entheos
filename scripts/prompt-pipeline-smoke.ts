import { strict as assert } from "node:assert";
import { runPromptPipeline } from "../modules/prompt-entheos/pipeline/prompt-optimization-pipeline";

const cases = [
  {
    provider: "openai",
    task: "general-chat",
    rawPrompt: "Help me answer a customer who is asking whether our onboarding includes migration support.",
  },
  {
    provider: "anthropic",
    task: "research-assistant",
    rawPrompt: "Compare two pricing directions for a B2B SaaS product and recommend which one is easier to launch first.",
    context: "Audience is the founding team. Keep it concise but strategic.",
  },
  {
    provider: "gemini",
    task: "marketing-copy",
    rawPrompt: "Write a stronger hero section for a tool that helps freelancers send proposals faster.",
  },
  {
    provider: "midjourney",
    task: "image-generation",
    rawPrompt: "A futuristic bookstore inside a desert oasis at blue hour",
  },
] as const;

for (const testCase of cases) {
  const result = runPromptPipeline(testCase);

  assert.equal(result.ok, true, `${testCase.provider} should resolve successfully`);

  if (!result.ok) {
    continue;
  }

  assert.equal(
    result.provider.id,
    testCase.provider,
    `${testCase.provider} should resolve to the expected provider`,
  );
  assert.equal(
    result.task.id,
    testCase.task,
    `${testCase.provider} should resolve to the expected task`,
  );
  assert.notEqual(
    result.output.prompt.trim(),
    testCase.rawPrompt.trim(),
    `${testCase.provider} should return a transformed prompt`,
  );

  console.log(
    [
      `[smoke] provider=${result.provider.id}`,
      `task=${result.task.id}`,
      `score=${result.output.score.overall}`,
    ].join(" "),
  );
}

console.log("[smoke] Prompt pipeline smoke test passed");
