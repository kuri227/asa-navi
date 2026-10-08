import { render, waitFor } from "@testing-library/react-native";
import { useLocalSearchParams } from "expo-router";

import MorningStartRoute from "@/app/morning/start";
import { startMorningSessionFromDatabase } from "@/infrastructure/app-services/morning-session";

jest.mock("expo-router", () => ({
  router: { replace: jest.fn() },
  useLocalSearchParams: jest.fn(),
}));

jest.mock("@/infrastructure/app-services/morning-session", () => ({
  startMorningSessionFromDatabase: jest.fn(),
}));

describe("morning start route", () => {
  it("uses the session id supplied by a manual or notification link", async () => {
    jest.mocked(useLocalSearchParams).mockReturnValue({
      sessionId: "session-from-link",
    });
    jest
      .mocked(startMorningSessionFromDatabase)
      .mockRejectedValue(new Error("stop after verifying input"));
    await render(<MorningStartRoute />);
    await waitFor(() =>
      expect(startMorningSessionFromDatabase).toHaveBeenCalledWith(
        "session-from-link",
      ),
    );
  });
});
