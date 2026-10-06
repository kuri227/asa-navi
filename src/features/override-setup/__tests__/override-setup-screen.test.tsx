import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { OverrideSetupScreen } from "../override-setup-screen";

describe("OverrideSetupScreen", () => {
  it("allows setup to continue without optional overrides", async () => {
    const onSave = jest.fn().mockResolvedValue(undefined);
    const onSaved = jest.fn();
    const screen = await render(
      <OverrideSetupScreen onSave={onSave} onSaved={onSaved} />,
    );
    await fireEvent.press(
      screen.getByRole("button", { name: "今は追加しない" }),
    );
    await waitFor(() => expect(onSave).toHaveBeenCalledWith([]));
    expect(onSaved).toHaveBeenCalledTimes(1);
  });

  it("saves cancel and replace overrides", async () => {
    const onSave = jest.fn().mockResolvedValue(undefined);
    const screen = await render(
      <OverrideSetupScreen onSave={onSave} onSaved={jest.fn()} />,
    );
    await fireEvent.press(screen.getByRole("button", { name: "例外日を追加" }));
    await fireEvent.changeText(
      screen.getByLabelText("対象日、必須"),
      "2026-10-13",
    );
    await fireEvent.press(screen.getByRole("button", { name: "例外日を追加" }));
    const dates = screen.getAllByLabelText("対象日、必須");
    await fireEvent.changeText(dates[1], "2026-10-20");
    await fireEvent.press(
      screen.getAllByRole("radio", { name: "特別時間割" })[1],
    );
    await fireEvent.changeText(
      screen.getByLabelText("最初の予定、必須"),
      "2限",
    );
    await fireEvent.changeText(
      screen.getByLabelText("開始時刻、必須"),
      "10:40",
    );
    await fireEvent.press(screen.getByRole("button", { name: "次へ" }));
    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith([
        { targetDate: "2026-10-13", overrideType: "cancel" },
        {
          targetDate: "2026-10-20",
          overrideType: "replace",
          title: "2限",
          startTime: "10:40",
          locationLabel: "",
        },
      ]),
    );
  });

  it("rejects a date that does not exist", async () => {
    const onSave = jest.fn().mockResolvedValue(undefined);
    const screen = await render(
      <OverrideSetupScreen onSave={onSave} onSaved={jest.fn()} />,
    );
    await fireEvent.press(screen.getByRole("button", { name: "例外日を追加" }));
    await fireEvent.changeText(
      screen.getByLabelText("対象日、必須"),
      "2026-02-31",
    );
    await fireEvent.press(screen.getByRole("button", { name: "次へ" }));
    expect(screen.getByText("YYYY-MM-DD形式で入力してください")).toBeTruthy();
    expect(onSave).not.toHaveBeenCalled();
  });
});
