import { assertValidPlanningInput } from "./assert-valid-planning-input";
import {
  calculateBasePlan,
  calculateNormalMorningDuration,
} from "./calculate-base-plan";
import { optimizeTasks } from "./optimize-tasks";
import type {
  PlannedTask,
  PlanningAdjustment,
  PlanningInput,
  PlanningResult,
} from "./types";

const MILLISECONDS_PER_MINUTE = 60_000;
const COMFORTABLE_SLACK_MIN = 10;

const availableWholeMinutes = (from: Date, until: Date): number =>
  Math.floor((until.getTime() - from.getTime()) / MILLISECONDS_PER_MINUTE);

const scheduleTasks = (
  tasks: readonly PlannedTask[],
  now: Date,
): readonly PlannedTask[] => {
  let cursorTime = now.getTime();

  return tasks.map((task) => {
    if (task.action === "skipped") {
      return task;
    }

    const plannedStartAt = new Date(cursorTime);
    cursorTime += task.plannedDurationMin * MILLISECONDS_PER_MINUTE;

    return {
      ...task,
      plannedStartAt,
      plannedEndAt: new Date(cursorTime),
    };
  });
};

export const calculatePlan = (input: PlanningInput): PlanningResult => {
  assertValidPlanningInput(input);

  const basePlan = calculateBasePlan(input);
  const enabledTasks = input.tasks.filter((task) => task.enabled);
  const normalRequiredMin = calculateNormalMorningDuration(enabledTasks);
  const availableMin = availableWholeMinutes(
    input.now,
    basePlan.latestDepartureAt,
  );
  const deficitMin = Math.max(0, normalRequiredMin - availableMin);
  const optimization = optimizeTasks(enabledTasks, deficitMin);
  const scheduledTasks = scheduleTasks(optimization.tasks, input.now);
  const plannedDurationMin = scheduledTasks.reduce(
    (total, task) => total + task.plannedDurationMin,
    0,
  );
  const predictedDepartureAt = new Date(
    input.now.getTime() + plannedDurationMin * MILLISECONDS_PER_MINUTE,
  );
  const departureDelayMs =
    predictedDepartureAt.getTime() - basePlan.latestDepartureAt.getTime();
  const lateByMin = Math.max(
    0,
    Math.ceil(departureDelayMs / MILLISECONDS_PER_MINUTE),
  );
  const slackMin = Math.max(
    0,
    Math.floor(-departureDelayMs / MILLISECONDS_PER_MINUTE),
  );
  const adjustments: PlanningAdjustment[] = [...optimization.adjustments];

  if (lateByMin > 0) {
    adjustments.push({ type: "late", lateByMin });
  }

  return {
    recommendedWakeAt: basePlan.recommendedWakeAt,
    latestDepartureAt: basePlan.latestDepartureAt,
    predictedDepartureAt,
    predictedArrivalAt: new Date(
      input.firstEvent.startAt.getTime() + departureDelayMs,
    ),
    slackMin,
    lateByMin,
    status:
      lateByMin > 0
        ? "late"
        : slackMin >= COMFORTABLE_SLACK_MIN
          ? "comfortable"
          : "tight",
    tasks: scheduledTasks,
    adjustments,
  };
};
