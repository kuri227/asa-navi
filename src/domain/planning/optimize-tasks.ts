import { compressTasks } from "./compress-tasks";
import { PlanningDomainError } from "./domain-error";
import type {
  MorningTaskTemplate,
  PlannedTask,
  PlanningAdjustment,
  TaskOptimizationResult,
} from "./types";

const compareSkipOrder = (
  left: MorningTaskTemplate,
  right: MorningTaskTemplate,
): number =>
  left.skipPriority - right.skipPriority ||
  left.sortOrder - right.sortOrder ||
  left.id.localeCompare(right.id);

export const optimizeTasks = (
  tasks: readonly MorningTaskTemplate[],
  deficitMin: number,
): TaskOptimizationResult => {
  const compressed = compressTasks(tasks, deficitMin);
  for (const task of tasks) {
    if (!Number.isSafeInteger(task.skipPriority) || task.skipPriority < 0) {
      throw new PlanningDomainError(
        "INVALID_PRIORITY",
        `Task ${task.id} skipPriority must be a non-negative safe integer.`,
      );
    }
  }

  if (compressed.remainingDeficitMin === 0) {
    return compressed;
  }

  const tasksById = new Map(
    compressed.tasks.map((task) => [task.taskId, task]),
  );
  const adjustments: PlanningAdjustment[] = [...compressed.adjustments];
  let remainingDeficitMin = compressed.remainingDeficitMin;

  const optionalTasks = tasks
    .filter((task) => task.enabled && task.requirement === "optional")
    .sort(compareSkipOrder);

  for (const optionalTask of optionalTasks) {
    if (remainingDeficitMin <= 0) {
      break;
    }

    const currentTask = tasksById.get(optionalTask.id);
    if (currentTask === undefined) {
      throw new PlanningDomainError(
        "DUPLICATE_ID",
        `Missing task ${optionalTask.id}.`,
      );
    }

    const savedMin = currentTask.plannedDurationMin;
    const skippedTask: PlannedTask = {
      ...currentTask,
      plannedDurationMin: 0,
      action: "skipped",
    };
    tasksById.set(optionalTask.id, skippedTask);
    adjustments.push({ type: "skip", taskId: optionalTask.id, savedMin });
    remainingDeficitMin -= savedMin;
  }

  return {
    tasks: compressed.tasks.map((task) => tasksById.get(task.taskId) ?? task),
    adjustments,
    remainingDeficitMin: Math.max(0, remainingDeficitMin),
  };
};
