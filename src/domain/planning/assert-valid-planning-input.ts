import { PlanningDomainError } from "./domain-error";
import type { PlanningInput } from "./types";

const assertNonNegativeInteger = (value: number, fieldName: string): void => {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new PlanningDomainError(
      "INVALID_DURATION",
      `${fieldName} must be a non-negative integer.`,
    );
  }
};

const assertPriority = (value: number, fieldName: string): void => {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new PlanningDomainError(
      "INVALID_PRIORITY",
      `${fieldName} must be a non-negative integer.`,
    );
  }
};

const assertUniqueIds = (ids: readonly string[], entityName: string): void => {
  if (new Set(ids).size !== ids.length) {
    throw new PlanningDomainError(
      "DUPLICATE_ID",
      `${entityName} IDs must be unique.`,
    );
  }
};

export const assertValidPlanningInput = (input: PlanningInput): void => {
  if (
    Number.isNaN(input.now.getTime()) ||
    Number.isNaN(input.firstEvent.startAt.getTime())
  ) {
    throw new PlanningDomainError(
      "INVALID_DATE",
      "Planning dates must be valid.",
    );
  }

  assertNonNegativeInteger(input.arrivalBufferMin, "arrivalBufferMin");
  assertUniqueIds(
    input.routeSegments.map((segment) => segment.id),
    "Route segment",
  );
  assertUniqueIds(
    input.tasks.map((task) => task.id),
    "Task",
  );

  for (const segment of input.routeSegments) {
    assertNonNegativeInteger(
      segment.durationMin,
      `routeSegments.${segment.id}.durationMin`,
    );
    assertPriority(segment.sortOrder, `routeSegments.${segment.id}.sortOrder`);
  }

  for (const task of input.tasks) {
    assertNonNegativeInteger(
      task.normalDurationMin,
      `tasks.${task.id}.normalDurationMin`,
    );
    assertNonNegativeInteger(
      task.minimumDurationMin,
      `tasks.${task.id}.minimumDurationMin`,
    );
    assertPriority(
      task.compressionPriority,
      `tasks.${task.id}.compressionPriority`,
    );
    assertPriority(task.skipPriority, `tasks.${task.id}.skipPriority`);
    assertPriority(task.sortOrder, `tasks.${task.id}.sortOrder`);

    if (task.minimumDurationMin > task.normalDurationMin) {
      throw new PlanningDomainError(
        "INVALID_TASK_DURATION_RANGE",
        `Task ${task.id} minimumDurationMin cannot exceed normalDurationMin.`,
      );
    }
  }
};
