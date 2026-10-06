import { fireEvent, render } from "@testing-library/react-native";

import { AppButton } from "../app-button";
import { TextField } from "../text-field";

describe("AppButton", () => {
  it("exposes a button role and invokes its action", async () => {
    const onPress = jest.fn();
    const screen = await render(<AppButton label="次へ" onPress={onPress} />);

    fireEvent.press(screen.getByRole("button", { name: "次へ" }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("does not invoke its action while disabled", async () => {
    const onPress = jest.fn();
    const screen = await render(
      <AppButton disabled label="保存" onPress={onPress} />,
    );

    fireEvent.press(screen.getByRole("button", { name: "保存" }));

    expect(onPress).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: "保存" }).props.accessibilityState,
    ).toEqual({
      disabled: true,
      busy: false,
    });
  });
});

describe("TextField", () => {
  it("labels required input and forwards text changes", async () => {
    const onChangeText = jest.fn();
    const screen = await render(
      <TextField
        label="自宅の最寄り駅"
        onChangeText={onChangeText}
        required
        value=""
      />,
    );

    fireEvent.changeText(screen.getByLabelText("自宅の最寄り駅、必須"), "吹田");

    expect(onChangeText).toHaveBeenCalledWith("吹田");
    expect(screen.getByText("自宅の最寄り駅（必須）")).toBeTruthy();
  });

  it("announces a recoverable validation error", async () => {
    const screen = await render(
      <TextField
        errorMessage="駅名を入力してください"
        label="学校の最寄り駅"
        value=""
      />,
    );

    const input = screen.getByLabelText("学校の最寄り駅");
    expect(input.props["aria-invalid"]).toBe(true);
    expect(input.props.accessibilityHint).toBe("駅名を入力してください");
    expect(screen.getByText("駅名を入力してください")).toBeTruthy();
  });
});
