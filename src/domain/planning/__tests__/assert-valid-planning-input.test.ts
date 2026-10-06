import {
  assertValidPlanningInput,
  PlanningDomainError,
} from "@/domain/planning";
import type { PlanningInput } from "@/domain/planning";

const createValidInput = (): PlanningInput => ({
  now: new Date("2026-10-06T07:00:00+09:00"),
  firstEvent: {
    id: "first-period",
    title: "1限",
    startAt: new Date("2026-10-06T09:00:00+09:00"),
  },
  arrivalBufferMin: 10,
  routeSegments: [],
  tasks: [
    {
      id: "breakfast",
      name: "朝食",
      normalDurationMin: 15,
      minimumDurationMin: 10,
      requirement: "required",
      compressionPriority: 1,
      skipPriority: 1,
      sortOrder: 1,
      enabled: true,
    },
  ],
  completedTaskIds: [],
});

describe("assertValidPlanningInput", () => {
  it("accepts empty routes and zero durations", () => {
    const input = createValidInput();
    const zeroDurationInput: PlanningInput = {
      ...input,
      tasks: [
        { ...input.tasks[0], normalDurationMin: 0, minimumDurationMin: 0 },
      ],
    };

    expect(() => assertValidPlanningInput(zeroDurationInput)).not.toThrow();
  });

  it("rejects a negative duration", () => {
    const input = createValidInput();
    const invalidInput: PlanningInput = {
      ...input,
      arrivalBufferMin: -1,
    };

    expect(() => assertValidPlanningInput(invalidInput)).toThrow(
      expect.objectContaining<Partial<PlanningDomainError>>({
        code: "INVALID_DURATION",
      }),
    );
  });

  it("rejects a minimum duration above the normal duration", () => {
    const input = createValidInput();
    const invalidInput: PlanningInput = {
      ...input,
      tasks: [
        { ...input.tasks[0], normalDurationMin: 10, minimumDurationMin: 11 },
      ],
    };

    expect(() => assertValidPlanningInput(invalidInput)).toThrow(
      expect.objectContaining<Partial<PlanningDomainError>>({
        code: "INVALID_TASK_DURATION_RANGE",
      }),
    );
  });

  it("rejects duplicate task IDs", () => {
    const input = createValidInput();
    const invalidInput: PlanningInput = {
      ...input,
      tasks: [input.tasks[0], { ...input.tasks[0], name: "着替え" }],
    };

    expect(() => assertValidPlanningInput(invalidInput)).toThrow(
      expect.objectContaining<Partial<PlanningDomainError>>({
        code: "DUPLICATE_ID",
      }),
    );
  });

  it("rejects invalid dates", () => {
    const invalidInput: PlanningInput = {
      ...createValidInput(),
      now: new Date(Number.NaN),
    };

    expect(() => assertValidPlanningInput(invalidInput)).toThrow(
      expect.objectContaining<Partial<PlanningDomainError>>({
        code: "INVALID_DATE",
      }),
    );
  });
});
