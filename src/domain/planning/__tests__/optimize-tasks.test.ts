import { optimizeTasks } from "@/domain/planning";
import type { MorningTaskTemplate, TaskRequirement } from "@/domain/planning";

const task = (
  id: string,
  normalDurationMin: number,
  minimumDurationMin: number,
  requirement: TaskRequirement,
  skipPriority: number,
  sortOrder: number,
): MorningTaskTemplate => ({
  id,
  name: id,
  normalDurationMin,
  minimumDurationMin,
  requirement,
  compressionPriority: 1,
  skipPriority,
  sortOrder,
  enabled: true,
});

describe("optimizeTasks", () => {
  it("compresses then skips an optional task for TC-P03", () => {
    const result = optimizeTasks(
      [
        task("required", 20, 10, "required", 2, 1),
        task("optional", 15, 15, "optional", 1, 2),
      ],
      20,
    );

    expect(result.remainingDeficitMin).toBe(0);
    expect(result.adjustments).toEqual([
      { type: "compress", taskId: "required", fromMin: 20, toMin: 10 },
      { type: "skip", taskId: "optional", savedMin: 15 },
    ]);
    expect(
      result.tasks.find((plannedTask) => plannedTask.taskId === "optional"),
    ).toEqual(
      expect.objectContaining({ action: "skipped", plannedDurationMin: 0 }),
    );
  });

  it("skips optional tasks by priority without skipping required tasks", () => {
    const result = optimizeTasks(
      [
        task("required", 10, 10, "required", 0, 1),
        task("later", 10, 10, "optional", 2, 2),
        task("first", 5, 5, "optional", 1, 3),
      ],
      12,
    );

    expect(result.adjustments).toEqual([
      { type: "skip", taskId: "first", savedMin: 5 },
      { type: "skip", taskId: "later", savedMin: 10 },
    ]);
    expect(
      result.tasks.find((plannedTask) => plannedTask.taskId === "required")
        ?.action,
    ).toBe("normal");
  });

  it("leaves a deficit when only required tasks remain", () => {
    const result = optimizeTasks(
      [task("required", 10, 10, "required", 1, 1)],
      6,
    );

    expect(result.adjustments).toEqual([]);
    expect(result.remainingDeficitMin).toBe(6);
  });

  it("handles zero optional tasks and exactly zero deficit", () => {
    const result = optimizeTasks(
      [task("required", 10, 5, "required", 1, 1)],
      0,
    );

    expect(result.remainingDeficitMin).toBe(0);
    expect(result.adjustments).toEqual([]);
  });
});
