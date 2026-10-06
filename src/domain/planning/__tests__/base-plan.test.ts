import { calculateBasePlan } from "@/domain/planning";
import type {
  MorningTaskTemplate,
  PlanningInput,
  RouteSegment,
} from "@/domain/planning";

const task = (
  id: string,
  normalDurationMin: number,
  enabled = true,
): MorningTaskTemplate => ({
  id,
  name: id,
  normalDurationMin,
  minimumDurationMin: normalDurationMin,
  requirement: "required",
  compressionPriority: 1,
  skipPriority: 1,
  sortOrder: 1,
  enabled,
});

const segment = (id: string, durationMin: number): RouteSegment => ({
  id,
  mode: "walk",
  fromLabel: "自宅",
  toLabel: "学校",
  durationMin,
  sortOrder: 1,
});

const createInput = (): PlanningInput => ({
  now: new Date("2026-10-06T07:00:00+09:00"),
  firstEvent: {
    id: "first-period",
    title: "1限",
    startAt: new Date("2026-10-06T09:00:00+09:00"),
  },
  arrivalBufferMin: 10,
  routeSegments: [segment("commute", 45)],
  tasks: [task("prepare", 60)],
  completedTaskIds: [],
});

describe("calculateBasePlan", () => {
  it("calculates TC-P01", () => {
    const result = calculateBasePlan(createInput());

    expect(result).toEqual({
      routeDurationMin: 45,
      normalMorningDurationMin: 60,
      latestDepartureAt: new Date("2026-10-06T08:05:00+09:00"),
      recommendedWakeAt: new Date("2026-10-06T07:05:00+09:00"),
    });
  });

  it("excludes disabled tasks from the morning duration", () => {
    const input: PlanningInput = {
      ...createInput(),
      tasks: [task("enabled", 20), task("disabled", 40, false)],
    };

    expect(calculateBasePlan(input).normalMorningDurationMin).toBe(20);
  });

  it("supports no tasks and a zero-minute route", () => {
    const input: PlanningInput = {
      ...createInput(),
      routeSegments: [],
      tasks: [],
    };

    const result = calculateBasePlan(input);

    expect(result.normalMorningDurationMin).toBe(0);
    expect(result.recommendedWakeAt).toEqual(result.latestDepartureAt);
  });

  it("returns equivalent results for the same input without mutating it", () => {
    const input = createInput();
    const originalStart = input.firstEvent.startAt.getTime();

    const firstResult = calculateBasePlan(input);
    const secondResult = calculateBasePlan(input);

    expect(secondResult).toEqual(firstResult);
    expect(input.firstEvent.startAt.getTime()).toBe(originalStart);
    expect(input.tasks[0].normalDurationMin).toBe(60);
  });
});
