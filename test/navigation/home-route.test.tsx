import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { router } from "expo-router";

import HomeRoute from "@/app/home";
import { loadHomeDashboardFromDatabase } from "@/infrastructure/app-services/load-tomorrow-plan";

jest.mock("expo-router", () => ({
  router: { push: jest.fn() },
}));

jest.mock("@/infrastructure/app-services/load-tomorrow-plan", () => ({
  loadHomeDashboardFromDatabase: jest.fn(),
}));

describe("home route", () => {
  it("opens exception editing for the displayed date", async () => {
    jest.mocked(loadHomeDashboardFromDatabase).mockResolvedValue({
      kind: "noSchedule",
      targetDate: "2026-10-10",
      timeZone: "Asia/Tokyo",
    });
    const screen = await render(<HomeRoute />);
    await waitFor(() =>
      screen.getByRole("button", { name: "明日の予定を変更" }),
    );
    fireEvent.press(screen.getByRole("button", { name: "明日の予定を変更" }));
    expect(router.push).toHaveBeenCalledWith({
      pathname: "/tomorrow-override",
      params: { targetDate: "2026-10-10" },
    });
  });
});
