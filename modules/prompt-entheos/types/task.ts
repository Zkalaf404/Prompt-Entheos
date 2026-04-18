export const taskIds = [
  "general-chat",
  "marketing-copy",
  "research-assistant",
  "image-generation",
] as const;

export const supportedTasks = taskIds;

export type TaskId = (typeof taskIds)[number];
export type SupportedTask = TaskId;

export interface TaskDetectionConfig {
  aliases: string[];
  patterns: RegExp[];
  priority?: number;
}

export interface TaskDefinition {
  id: SupportedTask;
  name: string;
  agentLabel: string;
  description: string;
  typicalOutputs: string[];
  detection: TaskDetectionConfig;
}
