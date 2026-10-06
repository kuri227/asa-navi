import { PlanningDomainError } from "./domain-error";

const MILLISECONDS_PER_MINUTE = 60_000;

const assertNonNegativeSafeInteger = (
  value: number,
  fieldName: string,
): void => {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new PlanningDomainError(
      "INVALID_DURATION",
      `${fieldName} must be a non-negative safe integer.`,
    );
  }
};

export const calculateLatestDepartureAt = (
  firstEventStartAt: Date,
  arrivalBufferMin: number,
  routeDurationMin: number,
): Date => {
  if (Number.isNaN(firstEventStartAt.getTime())) {
    throw new PlanningDomainError(
      "INVALID_DATE",
      "firstEventStartAt must be valid.",
    );
  }

  assertNonNegativeSafeInteger(arrivalBufferMin, "arrivalBufferMin");
  assertNonNegativeSafeInteger(routeDurationMin, "routeDurationMin");

  const totalLeadTimeMin = arrivalBufferMin + routeDurationMin;
  if (!Number.isSafeInteger(totalLeadTimeMin)) {
    throw new PlanningDomainError(
      "INVALID_DURATION",
      "The departure lead time exceeds the supported range.",
    );
  }

  const latestDepartureAt = new Date(
    firstEventStartAt.getTime() - totalLeadTimeMin * MILLISECONDS_PER_MINUTE,
  );

  if (Number.isNaN(latestDepartureAt.getTime())) {
    throw new PlanningDomainError(
      "INVALID_DATE",
      "The calculated latest departure date is outside the supported range.",
    );
  }

  return latestDepartureAt;
};
