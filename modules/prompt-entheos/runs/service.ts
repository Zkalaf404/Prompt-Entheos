import { randomUUID } from "node:crypto";
import { NotFoundError } from "@/modules/prompt-entheos/data/service-errors";
import { listSavedRuns, saveRuns } from "@/modules/prompt-entheos/runs/repository";
import type {
  PromptPipelineSuccess,
  SavedPromptRun,
} from "@/modules/prompt-entheos/types";

interface CreateRunInput {
  provider?: string;
  task?: string;
  rawPrompt: string;
  context?: string;
}

function sortRuns(runs: SavedPromptRun[]): SavedPromptRun[] {
  return [...runs].sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export async function listRuns(): Promise<SavedPromptRun[]> {
  return sortRuns(await listSavedRuns());
}

export async function getRunById(runId: string): Promise<SavedPromptRun> {
  const runs = await listSavedRuns();
  const run = runs.find((candidate) => candidate.id === runId);

  if (!run) {
    throw new NotFoundError(`Run "${runId}" was not found.`);
  }

  return run;
}

export async function createRun(args: {
  input: CreateRunInput;
  result: PromptPipelineSuccess;
  brandId?: string;
}): Promise<SavedPromptRun> {
  const runs = await listSavedRuns();
  const run: SavedPromptRun = {
    id: randomUUID(),
    provider: args.input.provider ?? args.result.provider.id,
    task: args.input.task?.toString() ?? args.result.task.id,
    rawPrompt: args.input.rawPrompt,
    context: args.input.context,
    brandId: args.brandId,
    optimizedPrompt: args.result.output.prompt,
    rationale: args.result.output.explanation,
    score: args.result.output.score,
    resolvedProvider: {
      id: args.result.provider.id,
      name: args.result.provider.name,
      description: args.result.provider.description,
    },
    resolvedTask: {
      id: args.result.task.id,
      name: args.result.task.name,
      description: args.result.task.description,
    },
    createdAt: new Date().toISOString(),
  };

  runs.unshift(run);
  await saveRuns(sortRuns(runs));

  return run;
}

export async function deleteRun(runId: string): Promise<void> {
  const runs = await listSavedRuns();
  const nextRuns = runs.filter((candidate) => candidate.id !== runId);

  if (nextRuns.length === runs.length) {
    throw new NotFoundError(`Run "${runId}" was not found.`);
  }

  await saveRuns(sortRuns(nextRuns));
}
