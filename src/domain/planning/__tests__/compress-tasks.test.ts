import { compressTasks } from "@/domain/planning";
import type { MorningTaskTemplate } from "@/domain/planning";

const task = (
  id: string,
  normalDurationMin: number,
  minimumDurationMin: number,
  compressionPriority: number,
  sortOrder: number,
): MorningTaskTemplate => ({
  id,
  name: id,
  normalDurationMin,
  minimumDurationMin,
  requirement: "required",
  compressionPriority,
  skipPriority: 1,
  sortOrder,
  enabled: true,
});

describe("compressTasks", () => {
  it("absorbs TC-P02's ten-minute deficit", () => {
    const result = compressTasks(
      [task("breakfast", 20, 10, 1, 2), task("grooming", 20, 15, 2, 1)],
      10,
    );

    expect(result.remainingDeficitMin).toBe(0);
    expect(result.adjustments).toEqual([
      { type: "compress", taskId: "breakfast", fromMin: 20, toMin: 10 },
    ]);
    expect(
      result.tasks.map(({ taskId, plannedDurationMin, action }) => ({
        taskId,
        plannedDurationMin,
        action,
      })),
    ).toEqual([
      { taskId: "grooming", plannedDurationMin: 20, action: "normal" },
      { taskId: "breakfast", plannedDurationMin: 10, action: "compressed" },
    ]);
  });

  it("uses sortOrder and then ID as deterministic tie breakers", () => {
    const result = compressTasks(
      [task("b", 10, 5, 1, 1), task("a", 10, 5, 1, 1)],
      7,
    );

    expect(result.adjustments).toEqual([
      { type: "compress", taskId: "a", fromMin: 10, toMin: 5 },
      { type: "compress", taskId: "b", fromMin: 10, toMin: 8 },
    ]);
  });

  it("never goes below minimumDurationMin", () => {
    const result = compressTasks([task("required", 10, 6, 1, 1)], 20);

    expect(result.tasks[0].plannedDurationMin).toBe(6);
    expect(result.remainingDeficitMin).toBe(16);
  });

  it("does not compress when minimum equals normal", () => {
    const result = compressTasks([task("fixed", 10, 10, 1, 1)], 5);

    expect(result.adjustments).toEqual([]);
    expect(result.tasks[0].action).toBe("normal");
    expect(result.remainingDeficitMin).toBe(5);
  });

  it("excludes disabled tasks", () => {
    const disabledTask = { ...task("disabled", 10, 0, 1, 1), enabled: false };

    expect(compressTasks([disabledTask], 5).tasks).toEqual([]);
  });
});
