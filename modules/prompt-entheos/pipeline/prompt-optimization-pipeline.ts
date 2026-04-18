import { analyzePromptInput } from "@/modules/prompt-entheos/agents/helpers";
import { normalizePromptInput } from "@/modules/prompt-entheos/pipeline/normalize";
import { resolveProvider } from "@/modules/prompt-entheos/resolver/provider-resolver";
import { detectTaskFromText } from "@/modules/prompt-entheos/tasks/detection";
import { listTasks, resolveTaskByTerm } from "@/modules/prompt-entheos/tasks/registry";
import type {
  PromptPipelineInput,
  PromptPipelineResult,
} from "@/modules/prompt-entheos/types";

export function runPromptPipeline(rawInput: PromptPipelineInput): PromptPipelineResult {
  const input = normalizePromptInput(rawInput);

  if (!input.rawPrompt) {
    return {
      ok: false,
      input,
      error: {
        code: "EMPTY_PROMPT",
        message: "Add a prompt before running optimization.",
      },
      suggestions: {
        providers: [],
        tasks: listTasks(),
      },
    };
  }

  if (rawInput.provider && !input.provider) {
    return {
      ok: false,
      input,
      error: {
        code: "INVALID_PROVIDER",
        message: `The provider "${rawInput.provider}" is not supported in the current starter registry.`,
      },
      suggestions: {
        providers: resolveProvider({ rawPrompt: input.rawPrompt }).suggestions,
        tasks: listTasks(),
      },
    };
  }

  if (rawInput.task && !input.task) {
    return {
      ok: false,
      input,
      error: {
        code: "INVALID_TASK",
        message: `The task "${rawInput.task}" is not part of the current starter task set.`,
      },
      suggestions: {
        providers: [],
        tasks: listTasks(),
      },
    };
  }

  const task =
    (input.task ? resolveTaskByTerm(input.task) : undefined) ??
    (() => {
      const detectedTaskId = detectTaskFromText(input.rawPrompt);
      return detectedTaskId ? resolveTaskByTerm(detectedTaskId) : undefined;
    })();

  if (!task) {
    return {
      ok: false,
      input,
      error: {
        code: "TASK_NOT_RESOLVED",
        message: "Prompt Entheos could not determine which task this request is for.",
      },
      suggestions: {
        providers: [],
        tasks: listTasks().slice(0, 5),
      },
    };
  }

  const resolution = resolveProvider({
    provider: input.provider,
    providerId: rawInput.providerId,
    targetHint: input.targetHint,
    rawPrompt: input.rawPrompt,
  });

  if (!resolution.matched || !resolution.provider || !resolution.agent) {
    return {
      ok: false,
      input,
      resolution,
      error: {
        code: "PROVIDER_NOT_RESOLVED",
        message:
          "Prompt Entheos could not map this request to a supported provider and starter agent.",
      },
      suggestions: {
        providers: resolution.suggestions,
        tasks: [task],
      },
    };
  }

  if (!resolution.provider.supportedTasks.includes(task.id)) {
    return {
      ok: false,
      input,
      resolution,
      error: {
        code: "TASK_NOT_SUPPORTED",
        message: `${resolution.provider.name} does not support the ${task.name} task in this starter architecture.`,
      },
      suggestions: {
        providers: resolution.suggestions,
        tasks: listTasks().filter((candidate) =>
          resolution.provider?.supportedTasks.includes(candidate.id),
        ),
      },
    };
  }

  const agentInput = {
    rawPrompt: input.context
      ? `${input.rawPrompt}\n\nAdditional context:\n${input.context}`
      : input.rawPrompt,
    task: task.id,
    brandContext: input.brandContext,
    language: input.language,
    constraints: input.constraints,
  } as const;

  const analysis = analyzePromptInput(resolution.provider, agentInput);
  const output = resolution.agent.optimize(agentInput);

  return {
    ok: true,
    input,
    provider: resolution.provider,
    task,
    resolution,
    analysis,
    output,
  };
}

export function runPromptOptimizationPipeline(
  rawInput: PromptPipelineInput,
): PromptPipelineResult {
  return runPromptPipeline(rawInput);
}
