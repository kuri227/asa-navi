import { fireEvent, render, waitFor } from "@testing-library/react-native";

import { RoutineSetupScreen } from "../routine-setup-screen";

describe("RoutineSetupScreen", () => {
  it("adds presets, changes their order, and saves editable values", async () => {
    const onSave = jest.fn().mockResolvedValue(undefined);
    const onSaved = jest.fn();
    const screen = await render(
      <RoutineSetupScreen onSave={onSave} onSaved={onSaved} />,
    );
    await fireEvent.press(screen.getByRole("button", { name: "朝食を追加" }));
    await fireEvent.press(
      screen.getByRole("button", { name: "持ち物確認を追加" }),
    );
    await fireEvent.changeText(
      screen.getAllByLabelText("通常時間（分）、必須")[0],
      "20",
    );
    await fireEvent.press(screen.getAllByRole("button", { name: "上へ" })[1]);
    await fireEvent.press(screen.getByRole("button", { name: "次へ" }));
    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith([
        {
          name: "持ち物確認",
          normalDurationMin: 5,
          minimumDurationMin: 3,
          requirement: "optional",
          specialType: "belongings",
        },
        {
          name: "朝食",
          normalDurationMin: 20,
          minimumDurationMin: 8,
          requirement: "required",
          specialType: "meal",
        },
      ]),
    );
    expect(onSaved).toHaveBeenCalledTimes(1);
  });

  it("requires at least one task", async () => {
    const onSave = jest.fn().mockResolvedValue(undefined);
    const screen = await render(
      <RoutineSetupScreen onSave={onSave} onSaved={jest.fn()} />,
    );
    await fireEvent.press(screen.getByRole("button", { name: "次へ" }));
    expect(screen.getByRole("alert")).toHaveTextContent(
      "朝のタスクを1つ以上追加してください。",
    );
    expect(onSave).not.toHaveBeenCalled();
  });

  it("shows a duration error before saving", async () => {
    const onSave = jest.fn().mockResolvedValue(undefined);
    const screen = await render(
      <RoutineSetupScreen onSave={onSave} onSaved={jest.fn()} />,
    );
    await fireEvent.press(screen.getByRole("button", { name: "朝食を追加" }));
    await fireEvent.changeText(
      screen.getByLabelText("最短時間（分）、必須"),
      "30",
    );
    await fireEvent.press(screen.getByRole("button", { name: "次へ" }));
    expect(
      screen.getByText("最短時間は通常時間以下にしてください。"),
    ).toBeTruthy();
    expect(onSave).not.toHaveBeenCalled();
  });
});
