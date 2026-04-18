import { taskCatalog } from "@/modules/prompt-entheos/tasks/catalog";
import type { NormalizedPromptInput, SupportedTask } from "@/modules/prompt-entheos/types";

export interface TaskDetectionMatch {
  task: SupportedTask;
  score: number;
}

function normalizeDetectionSource(input: string): string {
  return input.trim().toLowerCase();
}

export function scoreTaskMatches(
  source: string,
  allowedTasks?: SupportedTask[],
): TaskDetectionMatch[] {
  const normalizedSource = normalizeDetectionSource(source);

  if (!normalizedSource) {
    return [];
  }

  return taskCatalog
    .filter((task) => (allowedTasks ? allowedTasks.includes(task.id) : true))
    .map((task) => {
      const aliasHits = task.detection.aliases.filter((alias) =>
        normalizedSource.includes(alias.toLowerCase()),
      ).length;
      const patternHits = task.detection.patterns.filter((pattern) =>
        pattern.test(normalizedSource),
      ).length;

      return {
        task: task.id,
        score:
          aliasHits + patternHits > 0
            ? aliasHits * 80 + patternHits * 100 + (task.detection.priority ?? 0)
            : 0,
      };
    })
    .filter((match) => match.score > 0)
    .sort((left, right) => right.score - left.score);
}

export function detectTaskFromText(
  source: string,
  allowedTasks?: SupportedTask[],
): SupportedTask | undefined {
  return scoreTaskMatches(source, allowedTasks)[0]?.task;
}

export function detectRequestedTask(
  input: NormalizedPromptInput,
  allowedTasks?: SupportedTask[],
): SupportedTask | undefined {
  if (input.task) {
    return input.task;
  }

  const source = `${input.targetHint ?? ""} ${input.rawPrompt}`.trim();
  return detectTaskFromText(source, allowedTasks);
}
