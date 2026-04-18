import { randomUUID } from "node:crypto";
import type { BrandIntelligenceProfile } from "@/modules/prompt-entheos/types";
import { NotFoundError } from "@/modules/prompt-entheos/data/service-errors";
import { listSavedRuns, saveRuns } from "@/modules/prompt-entheos/runs/repository";
import type {
  PromptPipelineSuccess,
  RunComparison,
  RunComparisonRelationship,
  RunFilters,
  RunLineage,
  RunRefinementDraft,
  RunRefinementType,
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

function matchesRunFilters(run: SavedPromptRun, filters?: RunFilters): boolean {
  if (!filters) {
    return true;
  }

  if (filters.provider && run.resolvedProvider.id !== filters.provider) {
    return false;
  }

  if (filters.task && run.resolvedTask.id !== filters.task) {
    return false;
  }

  if (filters.brandProfileId && run.brandProfileId !== filters.brandProfileId) {
    return false;
  }

  return true;
}

function getRunMap(runs: SavedPromptRun[]): Map<string, SavedPromptRun> {
  return new Map(runs.map((run) => [run.id, run]));
}

function getRunLineageFromMap(run: SavedPromptRun, runMap: Map<string, SavedPromptRun>): RunLineage {
  let depth = 0;
  let current: SavedPromptRun | undefined = run;
  let rootRunId = run.id;
  const seen = new Set<string>();

  while (current?.parentRunId && !seen.has(current.parentRunId)) {
    seen.add(current.parentRunId);
    const parent = runMap.get(current.parentRunId);

    if (!parent) {
      rootRunId = current.parentRunId;
      depth += 1;
      break;
    }

    depth += 1;
    rootRunId = parent.id;
    current = parent;
  }

  return {
    isRefinement: Boolean(run.parentRunId),
    parentRunId: run.parentRunId,
    rootRunId,
    depth,
  };
}

function buildComparisonRelationship(
  left: SavedPromptRun,
  right: SavedPromptRun,
  runMap: Map<string, SavedPromptRun>,
): RunComparisonRelationship {
  if (left.parentRunId === right.id) {
    return {
      type: "parent-child",
      message: "The left run is a refinement of the right run.",
      parentRunId: right.id,
      childRunId: left.id,
    };
  }

  if (right.parentRunId === left.id) {
    return {
      type: "parent-child",
      message: "The right run is a refinement of the left run.",
      parentRunId: left.id,
      childRunId: right.id,
    };
  }

  if (left.parentRunId && left.parentRunId === right.parentRunId) {
    return {
      type: "siblings",
      message: "Both runs were refined from the same parent run.",
      commonAncestorRunId: left.parentRunId,
    };
  }

  const leftLineage = getRunLineageFromMap(left, runMap);
  const rightLineage = getRunLineageFromMap(right, runMap);

  if (leftLineage.rootRunId === rightLineage.rootRunId && leftLineage.rootRunId !== left.id && leftLineage.rootRunId !== right.id) {
    return {
      type: "same-root",
      message: "Both runs belong to the same refinement chain.",
      commonAncestorRunId: leftLineage.rootRunId,
    };
  }

  return {
    type: "unrelated",
    message: "These runs are separate optimization attempts.",
  };
}

export async function listRuns(filters?: RunFilters): Promise<SavedPromptRun[]> {
  return sortRuns((await listSavedRuns()).filter((run) => matchesRunFilters(run, filters)));
}

export async function getRunById(runId: string): Promise<SavedPromptRun> {
  const runs = await listSavedRuns();
  const run = runs.find((candidate) => candidate.id === runId);

  if (!run) {
    throw new NotFoundError(`Run "${runId}" was not found.`);
  }

  return run;
}

export async function getRunLineage(runId: string): Promise<RunLineage> {
  const runs = await listSavedRuns();
  const run = runs.find((candidate) => candidate.id === runId);

  if (!run) {
    throw new NotFoundError(`Run "${runId}" was not found.`);
  }

  return getRunLineageFromMap(run, getRunMap(runs));
}

export async function getRunRefinementDraft(runId: string): Promise<{
  sourceRun: SavedPromptRun;
  draft: RunRefinementDraft;
  lineage: RunLineage;
}> {
  const runs = await listSavedRuns();
  const sourceRun = runs.find((candidate) => candidate.id === runId);

  if (!sourceRun) {
    throw new NotFoundError(`Run "${runId}" was not found.`);
  }

  return {
    sourceRun,
    draft: {
      provider: sourceRun.provider,
      task: sourceRun.task,
      rawPrompt: sourceRun.rawPrompt,
      context: sourceRun.context,
      brandProfileId: sourceRun.brandProfileId,
      parentRunId: sourceRun.id,
      refinementType: "manual-refinement",
    },
    lineage: getRunLineageFromMap(sourceRun, getRunMap(runs)),
  };
}

export async function compareRuns(runIds: [string, string]): Promise<RunComparison> {
  const runs = await listSavedRuns();
  const runMap = getRunMap(runs);
  const left = runMap.get(runIds[0]);
  const right = runMap.get(runIds[1]);

  if (!left || !right) {
    throw new NotFoundError(`One or more runs could not be found for comparison.`);
  }

  return {
    runs: [left, right],
    relationship: buildComparisonRelationship(left, right, runMap),
  };
}

export async function createRun(args: {
  input: CreateRunInput;
  result: PromptPipelineSuccess;
  brandId?: string;
  brandProfile?: BrandIntelligenceProfile;
  parentRunId?: string;
  refinementType?: RunRefinementType | string;
}): Promise<SavedPromptRun> {
  const runs = await listSavedRuns();
  const now = new Date().toISOString();
  const run: SavedPromptRun = {
    id: randomUUID(),
    provider: args.input.provider ?? args.result.provider.id,
    task: args.input.task?.toString() ?? args.result.task.id,
    rawPrompt: args.input.rawPrompt,
    context: args.input.context,
    brandId: args.brandId,
    brandProfileId: args.brandProfile?.id,
    brandProfileName: args.brandProfile?.companyName,
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
    parentRunId: args.parentRunId,
    refinementType: args.refinementType,
    createdAt: now,
    updatedAt: now,
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
