import {
  createCustomTask,
  moveTask,
  toRoutineInputs,
} from "../routine-setup-model";

describe("routine setup model", () => {
  it("converts valid drafts into application inputs", () => {
    expect(
      toRoutineInputs([
        {
          ...createCustomTask("task-1"),
          name: " 朝食 ",
          normalDurationMin: "15",
          minimumDurationMin: "8",
        },
      ]),
    ).toEqual([
      {
        name: "朝食",
        normalDurationMin: 15,
        minimumDurationMin: 8,
        requirement: "required",
        specialType: "other",
      },
    ]);
  });

  it("rejects an empty routine and a minimum duration above normal", () => {
    expect(toRoutineInputs([])).toBeUndefined();
    expect(
      toRoutineInputs([
        {
          ...createCustomTask("task-1"),
          name: "朝食",
          normalDurationMin: "5",
          minimumDurationMin: "10",
        },
      ]),
    ).toBeUndefined();
  });

  it("moves tasks without mutating the input", () => {
    const first = { ...createCustomTask("first"), name: "朝食" };
    const second = { ...createCustomTask("second"), name: "着替え" };
    const input = [first, second];
    expect(moveTask(input, 1, 0)).toEqual([second, first]);
    expect(input).toEqual([first, second]);
  });
});
