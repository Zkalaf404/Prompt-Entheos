import { taskCatalog } from "@/modules/prompt-entheos/tasks/catalog";
import type { SupportedTask, TaskDefinition } from "@/modules/prompt-entheos/types";

const taskMap = new Map(taskCatalog.map((task) => [task.id, task]));

function normalizeTaskTerm(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function listTasks(): TaskDefinition[] {
  return [...taskCatalog];
}

export function getTaskById(taskId: SupportedTask): TaskDefinition {
  const task = taskMap.get(taskId);

  if (!task) {
    throw new Error(`Task "${taskId}" is missing from the task catalog.`);
  }

  return task;
}

export function hasTask(taskId: string): taskId is SupportedTask {
  return taskMap.has(taskId as SupportedTask);
}

export function resolveTaskByTerm(taskTerm: string): TaskDefinition | undefined {
  const normalizedTaskTerm = normalizeTaskTerm(taskTerm);

  if (!normalizedTaskTerm) {
    return undefined;
  }

  return taskCatalog.find((task) => {
    const terms = [task.id, task.name, ...task.detection.aliases].map(normalizeTaskTerm);
    return terms.includes(normalizedTaskTerm);
  });
}

export function filterTasks(taskIds: SupportedTask[]): TaskDefinition[] {
  return taskIds.filter(hasTask).map(getTaskById);
}
