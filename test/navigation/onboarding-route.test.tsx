import { fireEvent, render } from "@testing-library/react-native";
import { router } from "expo-router";

import OnboardingRoute from "@/app/index";

jest.mock("expo-router", () => ({
  router: {
    navigate: jest.fn(),
  },
}));

describe("onboarding route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("navigates to commute route setup", async () => {
    const screen = await render(<OnboardingRoute />);

    fireEvent.press(screen.getByRole("button", { name: "始める" }));

    expect(router.navigate).toHaveBeenCalledWith("/setup/route");
  });
});
