import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import { router } from "expo-router";

import OnboardingRoute from "@/app/index";
import { loadOnboardingCompleted } from "@/infrastructure/app-services/notification-onboarding";

jest.mock("expo-router", () => ({
  router: {
    navigate: jest.fn(),
    replace: jest.fn(),
  },
}));

jest.mock("@/infrastructure/app-services/notification-onboarding", () => ({
  loadOnboardingCompleted: jest.fn().mockResolvedValue(false),
}));

describe("onboarding route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(loadOnboardingCompleted).mockResolvedValue(false);
  });

  it("navigates to commute route setup", async () => {
    const status = deferred<boolean>();
    jest.mocked(loadOnboardingCompleted).mockReturnValue(status.promise);
    const screen = await render(<OnboardingRoute />);
    await act(async () => {
      status.resolve(false);
      await status.promise;
    });

    await waitFor(() => screen.getByRole("button", { name: "始める" }));
    fireEvent.press(screen.getByRole("button", { name: "始める" }));

    expect(router.navigate).toHaveBeenCalledWith("/setup/route");
  });

  it("skips setup after onboarding has completed", async () => {
    const status = deferred<boolean>();
    jest.mocked(loadOnboardingCompleted).mockReturnValue(status.promise);
    await render(<OnboardingRoute />);
    await act(async () => {
      status.resolve(true);
      await status.promise;
    });
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/home"));
  });

  it("offers a retry instead of reopening setup after a database error", async () => {
    const failedStatus = deferred<boolean>();
    const retryStatus = deferred<boolean>();
    jest
      .mocked(loadOnboardingCompleted)
      .mockReturnValueOnce(failedStatus.promise)
      .mockReturnValueOnce(retryStatus.promise);
    const screen = await render(<OnboardingRoute />);
    await act(async () => {
      failedStatus.reject(new Error("database unavailable"));
      await failedStatus.promise.catch(() => undefined);
    });
    await waitFor(() => screen.getByRole("button", { name: "もう一度試す" }));
    await fireEvent.press(screen.getByRole("button", { name: "もう一度試す" }));
    await act(async () => {
      retryStatus.resolve(false);
      await retryStatus.promise;
    });
    await waitFor(() => screen.getByRole("button", { name: "始める" }));
    expect(loadOnboardingCompleted).toHaveBeenCalledTimes(2);
  });
});

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}
