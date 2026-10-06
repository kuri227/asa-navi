import { fireEvent, render } from "@testing-library/react-native";

import { OnboardingScreen } from "../onboarding-screen";

describe("OnboardingScreen", () => {
  it("explains the product value and starts setup", async () => {
    const onStart = jest.fn();
    const screen = await render(<OnboardingScreen onStart={onStart} />);

    expect(
      screen.getByRole("header", {
        name: "朝のバタバタ、 もう終わりにしませんか？",
      }),
    ).toBeTruthy();
    expect(screen.getByText("セットアップは約3分です")).toBeTruthy();

    fireEvent.press(screen.getByRole("button", { name: "始める" }));

    expect(onStart).toHaveBeenCalledTimes(1);
  });
});
