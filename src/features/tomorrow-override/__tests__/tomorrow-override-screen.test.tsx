import { Alert } from "react-native";
import { fireEvent, render, waitFor } from "@testing-library/react-native";

import { TomorrowOverrideScreen } from "../tomorrow-override-screen";

const commonProps = {
  targetDate: "2026-10-10",
  timeZone: "Asia/Tokyo",
  onSave: jest.fn().mockResolvedValue(undefined),
  onRestore: jest.fn().mockResolvedValue(undefined),
  onDone: jest.fn(),
};

describe("TomorrowOverrideScreen", () => {
  beforeEach(() => jest.clearAllMocks());

  it("saves a cancellation for only the displayed date", async () => {
    const onSave = jest.fn().mockResolvedValue(undefined);
    const onDone = jest.fn();
    const screen = await render(
      <TomorrowOverrideScreen
        {...commonProps}
        loadOverride={jest.fn().mockResolvedValue(null)}
        onDone={onDone}
        onSave={onSave}
      />,
    );
    await waitFor(() => screen.getByText("10月10日（土）の予定"));
    await fireEvent.press(
      screen.getByRole("button", { name: "保存してホームへ" }),
    );
    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith({
        targetDate: "2026-10-10",
        overrideType: "cancel",
      }),
    );
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it("prefills an existing replacement", async () => {
    const screen = await render(
      <TomorrowOverrideScreen
        {...commonProps}
        loadOverride={jest.fn().mockResolvedValue({
          id: "override-1",
          targetDate: "2026-10-10",
          overrideType: "replace",
          title: "午後授業",
          startTime: "13:00",
          locationLabel: "講義棟B",
        })}
      />,
    );
    await waitFor(() => screen.getByDisplayValue("午後授業"));
    expect(screen.getByDisplayValue("13:00")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "通常の曜日予定に戻す" }),
    ).toBeTruthy();
  });

  it("asks for confirmation before deleting the date override", async () => {
    const alert = jest.spyOn(Alert, "alert").mockImplementation();
    const screen = await render(
      <TomorrowOverrideScreen
        {...commonProps}
        loadOverride={jest.fn().mockResolvedValue({
          id: "override-1",
          targetDate: "2026-10-10",
          overrideType: "cancel",
        })}
      />,
    );
    await waitFor(() =>
      screen.getByRole("button", { name: "通常の曜日予定に戻す" }),
    );
    fireEvent.press(
      screen.getByRole("button", { name: "通常の曜日予定に戻す" }),
    );
    expect(alert).toHaveBeenCalledWith(
      "通常の予定に戻しますか？",
      expect.any(String),
      expect.arrayContaining([
        expect.objectContaining({ text: "通常の予定に戻す" }),
      ]),
    );
    expect(commonProps.onRestore).not.toHaveBeenCalled();
  });
});
