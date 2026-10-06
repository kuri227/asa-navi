import { resolveDaySchedule } from "@/application/schedule";
import {
  calculatePlan,
  calculateRouteDuration,
  replan,
} from "@/domain/planning";
import type {
  MorningTaskTemplate,
  PlanningInput,
  RouteSegment,
  TaskRequirement,
} from "@/domain/planning";

const task = (
  id: string,
  normalDurationMin: number,
  minimumDurationMin: number,
  requirement: TaskRequirement = "required",
  sortOrder = 1,
): MorningTaskTemplate => ({
  id,
  name: id,
  normalDurationMin,
  minimumDurationMin,
  requirement,
  compressionPriority: sortOrder,
  skipPriority: sortOrder,
  sortOrder,
  enabled: true,
});

const route = (
  id: string,
  durationMin: number,
  sortOrder = 1,
): RouteSegment => ({
  id,
  mode: "walk",
  fromLabel: `${id}-from`,
  toLabel: `${id}-to`,
  durationMin,
  sortOrder,
});

const planningInput = (
  now: string,
  tasks: readonly MorningTaskTemplate[],
): PlanningInput => ({
  now: new Date(now),
  firstEvent: {
    id: "first-period",
    title: "1限",
    startAt: new Date("2026-10-06T09:00:00+09:00"),
  },
  arrivalBufferMin: 10,
  routeSegments: [route("commute", 45)],
  tasks,
  completedTaskIds: [],
});

describe("Planning Engine specification TC-P01–TC-P10", () => {
  it("TC-P01 calculates the normal departure and wake times", () => {
    const result = calculatePlan(
      planningInput("2026-10-06T07:05:00+09:00", [task("morning", 60, 60)]),
    );

    expect(result.latestDepartureAt).toEqual(
      new Date("2026-10-06T08:05:00+09:00"),
    );
    expect(result.recommendedWakeAt).toEqual(
      new Date("2026-10-06T07:05:00+09:00"),
    );
    expect(result.lateByMin).toBe(0);
  });

  it("TC-P02 absorbs a ten-minute deficit by compression", () => {
    const result = calculatePlan(
      planningInput("2026-10-06T07:15:00+09:00", [task("morning", 60, 45)]),
    );

    expect(result.lateByMin).toBe(0);
    expect(result.adjustments).toContainEqual({
      type: "compress",
      taskId: "morning",
      fromMin: 60,
      toMin: 50,
    });
  });

  it("TC-P03 skips an optional task after compression", () => {
    const result = calculatePlan(
      planningInput("2026-10-06T07:50:00+09:00", [
        task("required", 20, 10, "required", 1),
        task("optional", 15, 15, "optional", 2),
      ]),
    );

    expect(result.lateByMin).toBe(0);
    expect(result.adjustments).toContainEqual({
      type: "skip",
      taskId: "optional",
      savedMin: 15,
    });
  });

  it("TC-P04 reports an unavoidable twenty-minute delay", () => {
    const result = calculatePlan(
      planningInput("2026-10-06T08:05:00+09:00", [task("required", 40, 20)]),
    );

    expect(result.lateByMin).toBe(20);
  });

  it("TC-P05 excludes completed tasks", () => {
    const input = planningInput("2026-10-06T07:45:00+09:00", [
      task("completed", 20, 20, "required", 1),
      task("remaining", 20, 20, "required", 2),
    ]);

    const result = replan({ ...input, completedTaskIds: ["completed"] });

    expect(result.tasks.map((plannedTask) => plannedTask.taskId)).toEqual([
      "remaining",
    ]);
  });

  it("TC-P06 never goes below minimumDurationMin", () => {
    const result = calculatePlan(
      planningInput("2026-10-06T08:05:00+09:00", [task("required", 30, 12)]),
    );

    expect(result.tasks[0].plannedDurationMin).toBe(12);
  });

  it("TC-P07 never skips required tasks", () => {
    const result = calculatePlan(
      planningInput("2026-10-06T08:30:00+09:00", [task("required", 10, 10)]),
    );

    expect(result.tasks[0].action).not.toBe("skipped");
    expect(result.lateByMin).toBeGreaterThan(0);
  });

  it("TC-P08 cancels the date schedule", () => {
    expect(
      resolveDaySchedule({
        targetDate: "2026-10-06",
        timeZone: "Asia/Tokyo",
        weekdaySchedules: [],
        dateOverrides: [
          { id: "cancel", targetDate: "2026-10-06", overrideType: "cancel" },
        ],
      }),
    ).toBeNull();
  });

  it("TC-P09 replaces the weekday event", () => {
    const result = resolveDaySchedule({
      targetDate: "2026-10-06",
      timeZone: "Asia/Tokyo",
      weekdaySchedules: [
        {
          id: "weekday",
          weekday: 2,
          title: "1限",
          startTime: "09:00",
          isActive: true,
        },
      ],
      dateOverrides: [
        {
          id: "replace",
          targetDate: "2026-10-06",
          overrideType: "replace",
          title: "2限",
          startTime: "10:40",
        },
      ],
    });

    expect(result?.firstEvent.startAt).toEqual(
      new Date("2026-10-06T10:40:00+09:00"),
    );
  });

  it("TC-P10 sums walk, train, bus, and walk segments", () => {
    expect(
      calculateRouteDuration([
        route("walk-1", 8, 1),
        { ...route("train", 12, 2), mode: "train" },
        { ...route("bus", 6, 3), mode: "bus" },
        route("walk-2", 5, 4),
      ]),
    ).toBe(31);
  });
});
