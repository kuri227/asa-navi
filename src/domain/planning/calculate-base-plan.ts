import { assertValidPlanningInput } from "./assert-valid-planning-input";
import { calculateLatestDepartureAt } from "./calculate-latest-departure-at";
import { calculateRouteDuration } from "./calculate-route-duration";
import { PlanningDomainError } from "./domain-error";
import type { BasePlan, MorningTaskTemplate, PlanningInput } from "./types";

const MILLISECONDS_PER_MINUTE = 60_000;

export const calculateNormalMorningDuration = (
  tasks: readonly MorningTaskTemplate[],
): number =>
  tasks.reduce((totalDurationMin, task) => {
    if (!task.enabled) {
      return totalDurationMin;
    }

    if (
      !Number.isSafeInteger(task.normalDurationMin) ||
      task.normalDurationMin < 0
    ) {
      throw new PlanningDomainError(
        "INVALID_DURATION",
        `Task ${task.id} normalDurationMin must be a non-negative safe integer.`,
      );
    }

    const nextTotal = totalDurationMin + task.normalDurationMin;
    if (!Number.isSafeInteger(nextTotal)) {
      throw new PlanningDomainError(
        "INVALID_DURATION",
        "The total morning duration exceeds the supported range.",
      );
    }

    return nextTotal;
  }, 0);

export const calculateBasePlan = (input: PlanningInput): BasePlan => {
  assertValidPlanningInput(input);

  const routeDurationMin = calculateRouteDuration(input.routeSegments);
  const latestDepartureAt = calculateLatestDepartureAt(
    input.firstEvent.startAt,
    input.arrivalBufferMin,
    routeDurationMin,
  );
  const normalMorningDurationMin = calculateNormalMorningDuration(input.tasks);
  const recommendedWakeAt = new Date(
    latestDepartureAt.getTime() -
      normalMorningDurationMin * MILLISECONDS_PER_MINUTE,
  );

  if (Number.isNaN(recommendedWakeAt.getTime())) {
    throw new PlanningDomainError(
      "INVALID_DATE",
      "The calculated recommended wake date is outside the supported range.",
    );
  }

  return {
    routeDurationMin,
    normalMorningDurationMin,
    latestDepartureAt,
    recommendedWakeAt,
  };
};
