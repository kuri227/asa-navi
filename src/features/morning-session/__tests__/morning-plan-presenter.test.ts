import type { PlanningResult } from "@/domain/planning";

import {
  getAdjustmentText,
  getPlanStatusMessage,
  getWakeTimingMessage,
} from "../morning-plan-presenter";

const plannedWakeAt = new Date("2026-10-09T22:30:00.000Z");

describe("morning plan presenter", () => {
  it("describes early, exact, and late wake times without relying on color", () => {
    expect(
      getWakeTimingMessage(new Date("2026-10-09T22:20:00.000Z"), plannedWakeAt),
    ).toBe("予定より10分早い起床です");
    expect(getWakeTimingMessage(plannedWakeAt, plannedWakeAt)).toBe(
      "予定どおりの起床です",
    );
    expect(
      getWakeTimingMessage(new Date("2026-10-09T22:42:00.000Z"), plannedWakeAt),
    ).toBe("予定より12分遅い起床です");
  });

  it("states whether the current plan has slack or is late", () => {
    expect(getPlanStatusMessage(createPlan({ slackMin: 8 }))).toBe(
      "このプランなら8分の余裕があります",
    );
    expect(
      getPlanStatusMessage(createPlan({ slackMin: 0, lateByMin: 3 })),
    ).toBe("このプランでは3分遅れる見込みです");
  });

  it("turns compression and skip adjustments into task-specific sentences", () => {
    const names = new Map([["breakfast", "朝食"]]);
    expect(
      getAdjustmentText(
        { type: "compress", taskId: "breakfast", fromMin: 15, toMin: 8 },
        names,
      ),
    ).toBe("朝食を15分から8分に短縮");
    expect(
      getAdjustmentText(
        { type: "skip", taskId: "breakfast", savedMin: 15 },
        names,
      ),
    ).toBe("朝食を省略");
  });
});

function createPlan(update: Partial<PlanningResult>): PlanningResult {
  const now = new Date("2026-10-09T22:30:00.000Z");
  return {
    recommendedWakeAt: now,
    latestDepartureAt: now,
    predictedDepartureAt: now,
    predictedArrivalAt: now,
    slackMin: 0,
    lateByMin: 0,
    status: "tight",
    tasks: [],
    adjustments: [],
    ...update,
  };
}
