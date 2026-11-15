import { fireEvent, render } from "@testing-library/react-native";

import { OnboardingScreen } from "../onboarding-screen";

describe("OnboardingScreen", () => {
  it("shows a clearly marked sample morning and starts setup", async () => {
    const onStart = jest.fn();
    const screen = await render(<OnboardingScreen onStart={onStart} />);

    expect(
      screen.getByRole("header", {
        name: "朝ナビ",
      }),
    ).toBeTruthy();
    expect(screen.getByText("朝のプラン例")).toBeTruthy();
    expect(screen.getByText("06:45")).toBeTruthy();
    expect(screen.getByText("起床")).toBeTruthy();
    expect(screen.getByText("出発")).toBeTruthy();
    expect(screen.getByText("1限")).toBeTruthy();
    expect(screen.queryByText("セットアップは約3分です")).toBeNull();

    fireEvent.press(screen.getByRole("button", { name: "始める" }));

    expect(onStart).toHaveBeenCalledTimes(1);
  });
});
