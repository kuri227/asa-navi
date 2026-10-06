import { fireEvent, render, waitFor } from "@testing-library/react-native";

import { NotificationSetupScreen } from "../notification-setup-screen";

describe("NotificationSetupScreen", () => {
  it("explains notifications before requesting OS permission", async () => {
    const onRequestPermission = jest.fn().mockResolvedValue("granted");
    const onComplete = jest.fn().mockResolvedValue(undefined);
    const onCompleted = jest.fn();
    const screen = await render(
      <NotificationSetupScreen
        onRequestPermission={onRequestPermission}
        onComplete={onComplete}
        onCompleted={onCompleted}
      />,
    );
    expect(screen.getByText("通知を使う理由")).toBeTruthy();
    expect(onRequestPermission).not.toHaveBeenCalled();
    await fireEvent.press(
      screen.getByRole("button", { name: "通知を許可して完了" }),
    );
    await waitFor(() => expect(onRequestPermission).toHaveBeenCalledTimes(1));
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onCompleted).toHaveBeenCalledTimes(1);
  });

  it("does not trap the user when permission is denied", async () => {
    const onRequestPermission = jest.fn().mockResolvedValue("denied");
    const onComplete = jest.fn().mockResolvedValue(undefined);
    const onCompleted = jest.fn();
    const screen = await render(
      <NotificationSetupScreen
        onRequestPermission={onRequestPermission}
        onComplete={onComplete}
        onCompleted={onCompleted}
      />,
    );
    await fireEvent.press(
      screen.getByRole("button", { name: "通知を許可して完了" }),
    );
    await waitFor(() => expect(screen.getByRole("alert")).toBeTruthy());
    expect(onComplete).not.toHaveBeenCalled();
    await fireEvent.press(
      screen.getByRole("button", { name: "今は許可せず完了" }),
    );
    await waitFor(() => expect(onCompleted).toHaveBeenCalledTimes(1));
  });

  it("can complete setup without opening the permission prompt", async () => {
    const onRequestPermission = jest.fn();
    const onComplete = jest.fn().mockResolvedValue(undefined);
    const onCompleted = jest.fn();
    const screen = await render(
      <NotificationSetupScreen
        onRequestPermission={onRequestPermission}
        onComplete={onComplete}
        onCompleted={onCompleted}
      />,
    );
    await fireEvent.press(
      screen.getByRole("button", { name: "今は許可せず完了" }),
    );
    await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1));
    expect(onRequestPermission).not.toHaveBeenCalled();
  });

  it("keeps the user on the screen when completion cannot be saved", async () => {
    const onCompleted = jest.fn();
    const screen = await render(
      <NotificationSetupScreen
        onRequestPermission={jest.fn()}
        onComplete={jest
          .fn()
          .mockRejectedValue(new Error("database unavailable"))}
        onCompleted={onCompleted}
      />,
    );
    await fireEvent.press(
      screen.getByRole("button", { name: "今は許可せず完了" }),
    );
    await waitFor(() =>
      expect(
        screen.getByText(
          "初期設定を完了できませんでした。もう一度お試しください。",
        ),
      ).toBeTruthy(),
    );
    expect(onCompleted).not.toHaveBeenCalled();
  });
});
