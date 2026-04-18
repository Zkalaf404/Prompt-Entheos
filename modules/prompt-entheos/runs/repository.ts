import { readJsonFile, writeJsonFile } from "@/modules/prompt-entheos/data/file-store";
import type { SavedPromptRun } from "@/modules/prompt-entheos/types";

const runsFileName = "runs.json";

export async function listSavedRuns(): Promise<SavedPromptRun[]> {
  return readJsonFile<SavedPromptRun[]>(runsFileName, []);
}

export async function saveRuns(runs: SavedPromptRun[]): Promise<void> {
  await writeJsonFile(runsFileName, runs);
}
