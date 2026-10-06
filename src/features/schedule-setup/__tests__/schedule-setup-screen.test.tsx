import { fireEvent, render, waitFor } from "@testing-library/react-native";

import { ScheduleSetupScreen } from "../schedule-setup-screen";

describe("ScheduleSetupScreen", () => {
  it("saves seven weekdays including days without schedules", async () => {
    const onSave = jest.fn().mockResolvedValue(undefined);
    const onSaved = jest.fn();
    const screen = await render(
      <ScheduleSetupScreen onSave={onSave} onSaved={onSaved} />,
    );

    await fireEvent(
      screen.getByLabelText("月曜日に予定がある"),
      "valueChange",
      false,
    );
    await fireEvent(
      screen.getByLabelText("土曜日に予定がある"),
      "valueChange",
      true,
    );
    const saturdayTitle = screen.getAllByLabelText("最初の予定、必須")[4];
    const saturdayTime = screen.getAllByLabelText("開始時刻、必須")[4];
    await fireEvent.changeText(saturdayTitle, "補講");
    await fireEvent.changeText(saturdayTime, "10:30");
    await fireEvent.press(screen.getByRole("button", { name: "次へ" }));

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    const savedDays = onSave.mock.calls[0][0];
    expect(savedDays).toHaveLength(7);
    expect(
      savedDays.find(({ weekday }: { weekday: number }) => weekday === 1),
    ).toMatchObject({
      hasSchedule: false,
    });
    expect(
      savedDays.find(({ weekday }: { weekday: number }) => weekday === 6),
    ).toMatchObject({
      hasSchedule: true,
      title: "補講",
      startTime: "10:30",
    });
    expect(onSaved).toHaveBeenCalledTimes(1);
  });

  it("shows field errors for an invalid enabled day", async () => {
    const onSave = jest.fn().mockResolvedValue(undefined);
    const screen = await render(
      <ScheduleSetupScreen onSave={onSave} onSaved={jest.fn()} />,
    );

    await fireEvent.changeText(
      screen.getAllByLabelText("開始時刻、必須")[0],
      "25:00",
    );
    await fireEvent.press(screen.getByRole("button", { name: "次へ" }));

    expect(screen.getByText("入力内容を確認してください。")).toBeTruthy();
    expect(screen.getByText("HH:mm形式で入力してください")).toBeTruthy();
    expect(onSave).not.toHaveBeenCalled();
  });
});
