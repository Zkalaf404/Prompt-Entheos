import { readJsonFile, writeJsonFile } from "@/modules/prompt-entheos/data/file-store";
import type { SavedPromptRun } from "@/modules/prompt-entheos/types";

const runsFileName = "runs.json";

function normalizeSavedRun(run: Partial<SavedPromptRun>): SavedPromptRun {
  const createdAt = typeof run.createdAt === "string" ? run.createdAt : new Date(0).toISOString();

  return {
    id: typeof run.id === "string" ? run.id : "",
    provider: typeof run.provider === "string" ? run.provider : "",
    task: typeof run.task === "string" ? run.task : "",
    rawPrompt: typeof run.rawPrompt === "string" ? run.rawPrompt : "",
    context: typeof run.context === "string" ? run.context : undefined,
    brandId: typeof run.brandId === "string" ? run.brandId : undefined,
    brandProfileId:
      typeof run.brandProfileId === "string" ? run.brandProfileId : undefined,
    brandProfileName:
      typeof run.brandProfileName === "string" ? run.brandProfileName : undefined,
    optimizedPrompt: typeof run.optimizedPrompt === "string" ? run.optimizedPrompt : "",
    rationale:
      run.rationale && typeof run.rationale.summary === "string" && Array.isArray(run.rationale.reasons)
        ? {
            summary: run.rationale.summary,
            reasons: run.rationale.reasons.filter((reason): reason is string => typeof reason === "string"),
          }
        : {
            summary: "",
            reasons: [],
          },
    score:
      run.score && typeof run.score === "object"
        ? run.score
        : {
            overall: 0,
            summary: "",
            breakdown: {
              clarity: 0,
              structure: 0,
              specificity: 0,
              providerFit: 0,
              constraintCoverage: 0,
            },
          },
    resolvedProvider:
      run.resolvedProvider &&
      typeof run.resolvedProvider.id === "string" &&
      typeof run.resolvedProvider.name === "string" &&
      typeof run.resolvedProvider.description === "string"
        ? run.resolvedProvider
        : {
            id: "openai",
            name: typeof run.provider === "string" ? run.provider : "Unknown provider",
            description: "",
          },
    resolvedTask:
      run.resolvedTask &&
      typeof run.resolvedTask.id === "string" &&
      typeof run.resolvedTask.name === "string" &&
      typeof run.resolvedTask.description === "string"
        ? run.resolvedTask
        : {
            id: "general-chat",
            name: typeof run.task === "string" ? run.task : "Unknown task",
            description: "",
          },
    parentRunId: typeof run.parentRunId === "string" ? run.parentRunId : undefined,
    refinementType: typeof run.refinementType === "string" ? run.refinementType : undefined,
    createdAt,
    updatedAt: typeof run.updatedAt === "string" ? run.updatedAt : createdAt,
  };
}

export async function listSavedRuns(): Promise<SavedPromptRun[]> {
  const runs = await readJsonFile<Partial<SavedPromptRun>[]>(runsFileName, []);
  const normalizedRuns = runs
    .map(normalizeSavedRun)
    .filter((run) => Boolean(run.id));

  if (JSON.stringify(runs) !== JSON.stringify(normalizedRuns)) {
    await saveRuns(normalizedRuns);
  }

  return normalizedRuns;
}

export async function saveRuns(runs: SavedPromptRun[]): Promise<void> {
  await writeJsonFile(runsFileName, runs);
}
