import { PlanningDomainError } from "./domain-error";
import type {
  MorningTaskTemplate,
  PlannedTask,
  PlanningAdjustment,
  TaskOptimizationResult,
} from "./types";

const compareTaskOrder = (
  left: MorningTaskTemplate,
  right: MorningTaskTemplate,
): number =>
  left.sortOrder - right.sortOrder || left.id.localeCompare(right.id);

const compareCompressionOrder = (
  left: MorningTaskTemplate,
  right: MorningTaskTemplate,
): number =>
  left.compressionPriority - right.compressionPriority ||
  compareTaskOrder(left, right);

const assertCompressionInput = (
  tasks: readonly MorningTaskTemplate[],
  deficitMin: number,
): void => {
  if (!Number.isSafeInteger(deficitMin) || deficitMin < 0) {
    throw new PlanningDomainError(
      "INVALID_DURATION",
      "deficitMin must be a non-negative safe integer.",
    );
  }

  if (new Set(tasks.map((task) => task.id)).size !== tasks.length) {
    throw new PlanningDomainError("DUPLICATE_ID", "Task IDs must be unique.");
  }

  for (const task of tasks) {
    if (
      !Number.isSafeInteger(task.normalDurationMin) ||
      !Number.isSafeInteger(task.minimumDurationMin) ||
      task.normalDurationMin < 0 ||
      task.minimumDurationMin < 0
    ) {
      throw new PlanningDomainError(
        "INVALID_DURATION",
        `Task ${task.id} durations must be non-negative safe integers.`,
      );
    }

    if (task.minimumDurationMin > task.normalDurationMin) {
      throw new PlanningDomainError(
        "INVALID_TASK_DURATION_RANGE",
        `Task ${task.id} minimumDurationMin cannot exceed normalDurationMin.`,
      );
    }

    if (
      !Number.isSafeInteger(task.compressionPriority) ||
      task.compressionPriority < 0 ||
      !Number.isSafeInteger(task.sortOrder) ||
      task.sortOrder < 0
    ) {
      throw new PlanningDomainError(
        "INVALID_PRIORITY",
        `Task ${task.id} priorities must be non-negative safe integers.`,
      );
    }
  }
};

export const compressTasks = (
  tasks: readonly MorningTaskTemplate[],
  deficitMin: number,
): TaskOptimizationResult => {
  assertCompressionInput(tasks, deficitMin);

  const enabledTasks = tasks.filter((task) => task.enabled);
  const durationsByTaskId = new Map(
    enabledTasks.map((task) => [task.id, task.normalDurationMin]),
  );
  const adjustments: PlanningAdjustment[] = [];
  let remainingDeficitMin = deficitMin;

  for (const task of [...enabledTasks].sort(compareCompressionOrder)) {
    if (remainingDeficitMin === 0) {
      break;
    }

    const compressibleMin = task.normalDurationMin - task.minimumDurationMin;
    const savedMin = Math.min(compressibleMin, remainingDeficitMin);
    if (savedMin === 0) {
      continue;
    }

    const plannedDurationMin = task.normalDurationMin - savedMin;
    durationsByTaskId.set(task.id, plannedDurationMin);
    adjustments.push({
      type: "compress",
      taskId: task.id,
      fromMin: task.normalDurationMin,
      toMin: plannedDurationMin,
    });
    remainingDeficitMin -= savedMin;
  }

  const plannedTasks: PlannedTask[] = [...enabledTasks]
    .sort(compareTaskOrder)
    .map((task) => {
      const plannedDurationMin = durationsByTaskId.get(task.id);
      if (plannedDurationMin === undefined) {
        throw new PlanningDomainError(
          "DUPLICATE_ID",
          `Missing duration for task ${task.id}.`,
        );
      }

      return {
        taskId: task.id,
        name: task.name,
        plannedDurationMin,
        action:
          plannedDurationMin === task.normalDurationMin
            ? "normal"
            : "compressed",
      };
    });

  return { tasks: plannedTasks, adjustments, remainingDeficitMin };
};
