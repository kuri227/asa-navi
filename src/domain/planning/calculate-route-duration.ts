import { PlanningDomainError } from "./domain-error";
import type { RouteSegment } from "./types";

export const calculateRouteDuration = (
  segments: readonly RouteSegment[],
): number =>
  segments.reduce((totalDurationMin, segment) => {
    if (!Number.isSafeInteger(segment.durationMin) || segment.durationMin < 0) {
      throw new PlanningDomainError(
        "INVALID_DURATION",
        `Route segment ${segment.id} durationMin must be a non-negative safe integer.`,
      );
    }

    const nextTotal = totalDurationMin + segment.durationMin;
    if (!Number.isSafeInteger(nextTotal)) {
      throw new PlanningDomainError(
        "INVALID_DURATION",
        "The total route duration exceeds the supported range.",
      );
    }

    return nextTotal;
  }, 0);
