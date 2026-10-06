import { calculatePlan } from "@/domain/planning";
import type { MorningTaskTemplate, PlanningInput } from "@/domain/planning";

const task = (
  id: string,
  normalDurationMin: number,
  minimumDurationMin: number,
  requirement: "required" | "optional" = "required",
): MorningTaskTemplate => ({
  id,
  name: id,
  normalDurationMin,
  minimumDurationMin,
  requirement,
  compressionPriority: 1,
  skipPriority: 1,
  sortOrder: 1,
  enabled: true,
});

const createInput = (
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
  routeSegments: [
    {
      id: "commute",
      mode: "train",
      fromLabel: "自宅",
      toLabel: "学校",
      durationMin: 45,
      sortOrder: 1,
    },
  ],
  tasks,
  completedTaskIds: [],
});

describe("calculatePlan", () => {
  it("returns an on-time tight plan for TC-P01", () => {
    const result = calculatePlan(
      createInput("2026-10-06T07:05:00+09:00", [task("morning", 60, 60)]),
    );

    expect(result.latestDepartureAt).toEqual(
      new Date("2026-10-06T08:05:00+09:00"),
    );
    expect(result.recommendedWakeAt).toEqual(
      new Date("2026-10-06T07:05:00+09:00"),
    );
    expect(result.predictedDepartureAt).toEqual(
      new Date("2026-10-06T08:05:00+09:00"),
    );
    expect(result.lateByMin).toBe(0);
    expect(result.slackMin).toBe(0);
    expect(result.status).toBe("tight");
  });

  it("reports TC-P04's unavoidable twenty-minute delay", () => {
    const result = calculatePlan(
      createInput("2026-10-06T08:05:00+09:00", [task("required", 40, 20)]),
    );

    expect(result.lateByMin).toBe(20);
    expect(result.status).toBe("late");
    expect(result.predictedDepartureAt).toEqual(
      new Date("2026-10-06T08:25:00+09:00"),
    );
    expect(result.predictedArrivalAt).toEqual(
      new Date("2026-10-06T09:20:00+09:00"),
    );
    expect(result.adjustments.at(-1)).toEqual({ type: "late", lateByMin: 20 });
  });

  it("is comfortable at exactly ten minutes of slack", () => {
    const result = calculatePlan(
      createInput("2026-10-06T06:55:00+09:00", [task("morning", 60, 60)]),
    );

    expect(result.slackMin).toBe(10);
    expect(result.status).toBe("comfortable");
  });

  it("rounds a partial-minute delay up conservatively", () => {
    const result = calculatePlan(
      createInput("2026-10-06T08:05:01+09:00", [task("required", 0, 0)]),
    );

    expect(result.lateByMin).toBe(1);
    expect(result.status).toBe("late");
  });

  it("reports lateness when the event has already started", () => {
    const result = calculatePlan(
      createInput("2026-10-06T09:05:00+09:00", [task("required", 0, 0)]),
    );

    expect(result.lateByMin).toBe(60);
    expect(result.predictedArrivalAt).toEqual(
      new Date("2026-10-06T10:00:00+09:00"),
    );
  });
});
