import { calculatePlan, replan } from "@/domain/planning";
import type { MorningTaskTemplate, PlanningInput } from "@/domain/planning";

const task = (
  id: string,
  durationMin: number,
  sortOrder: number,
): MorningTaskTemplate => ({
  id,
  name: id,
  normalDurationMin: durationMin,
  minimumDurationMin: durationMin,
  requirement: "required",
  compressionPriority: sortOrder,
  skipPriority: sortOrder,
  sortOrder,
  enabled: true,
});

const createInput = (): PlanningInput => ({
  now: new Date("2026-10-06T07:45:00+09:00"),
  firstEvent: {
    id: "first-period",
    title: "1限",
    startAt: new Date("2026-10-06T09:00:00+09:00"),
  },
  arrivalBufferMin: 10,
  routeSegments: [
    {
      id: "route",
      mode: "train",
      fromLabel: "自宅",
      toLabel: "学校",
      durationMin: 45,
      sortOrder: 1,
    },
  ],
  tasks: [
    task("completed-breakfast", 20, 1),
    task("remaining-grooming", 20, 2),
  ],
  completedTaskIds: ["completed-breakfast"],
});

describe("replan", () => {
  it("excludes completed tasks for TC-P05", () => {
    const result = replan(createInput());

    expect(result.tasks.map((plannedTask) => plannedTask.taskId)).toEqual([
      "remaining-grooming",
    ]);
    expect(result.predictedDepartureAt).toEqual(
      new Date("2026-10-06T08:05:00+09:00"),
    );
    expect(result.lateByMin).toBe(0);
  });

  it("retains the original base-plan wake recommendation", () => {
    const input = createInput();

    expect(replan(input).recommendedWakeAt).toEqual(
      calculatePlan({ ...input, completedTaskIds: [] }).recommendedWakeAt,
    );
  });

  it("returns no planned tasks when all tasks completed", () => {
    const input: PlanningInput = {
      ...createInput(),
      now: new Date("2026-10-06T08:00:00+09:00"),
      completedTaskIds: ["completed-breakfast", "remaining-grooming"],
    };

    const result = replan(input);

    expect(result.tasks).toEqual([]);
    expect(result.predictedDepartureAt).toEqual(input.now);
    expect(result.slackMin).toBe(5);
  });

  it("does not mutate completedTaskIds or tasks", () => {
    const input = createInput();
    const completedIdsBefore = [...input.completedTaskIds];

    replan(input);

    expect(input.completedTaskIds).toEqual(completedIdsBefore);
    expect(input.tasks).toHaveLength(2);
  });
});
