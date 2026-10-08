import { act, fireEvent, render, waitFor } from "@testing-library/react-native";

import type { HomeDashboardData } from "@/application/home";

import { HomeScreen } from "../home-screen";

const plannedPreview: HomeDashboardData = {
  kind: "planned",
  targetDate: "2026-10-10",
  timeZone: "Asia/Tokyo",
  source: "weekday",
  firstEvent: {
    id: "event-1",
    title: "1限 英語",
    startAt: new Date("2026-10-09T23:50:00.000Z"),
    locationLabel: "講義棟A",
  },
  routeId: "route-1",
  routeName: "いつもの通学ルート",
  routeSegments: [
    {
      id: "segment-1",
      mode: "train",
      fromLabel: "吹田駅",
      toLabel: "大学前駅",
      durationMin: 30,
      sortOrder: 0,
    },
  ],
  basePlan: {
    routeDurationMin: 30,
    normalMorningDurationMin: 45,
    latestDepartureAt: new Date("2026-10-09T23:10:00.000Z"),
    recommendedWakeAt: new Date("2026-10-09T22:25:00.000Z"),
  },
  alarmState: "notScheduled",
  sessionId: "session-1",
};

describe("HomeScreen", () => {
  it("shows tomorrow's resolved plan in the device time zone", async () => {
    const request = deferred<HomeDashboardData>();
    const screen = await render(
      <HomeScreen
        loadPlan={() => request.promise}
        onEditTomorrow={jest.fn()}
        onStartMorning={jest.fn()}
      />,
    );
    expect(screen.getByLabelText("明日の予定を読み込み中")).toBeTruthy();
    await act(async () => {
      request.resolve(plannedPreview);
      await request.promise;
    });
    expect(screen.getByText("10月10日（土）")).toBeTruthy();
    expect(screen.getByText("08:50　1限 英語")).toBeTruthy();
    expect(screen.getByText("07:25")).toBeTruthy();
    expect(screen.getByText("08:10")).toBeTruthy();
    expect(screen.getByText("電車")).toBeTruthy();
    expect(screen.getByText("起床通知は未予約です")).toBeTruthy();
  });

  it("shows the override source and opens tomorrow editing", async () => {
    const onEditTomorrow = jest.fn();
    const screen = await render(
      <HomeScreen
        loadPlan={jest.fn().mockResolvedValue({
          ...plannedPreview,
          source: "override",
        })}
        onEditTomorrow={onEditTomorrow}
        onStartMorning={jest.fn()}
      />,
    );
    await waitFor(() => screen.getByText("例外予定"));
    fireEvent.press(screen.getByRole("button", { name: "明日の予定を変更" }));
    expect(onEditTomorrow).toHaveBeenCalledWith("2026-10-10");
  });

  it("explains when tomorrow has no schedule", async () => {
    const screen = await render(
      <HomeScreen
        loadPlan={jest.fn().mockResolvedValue({
          kind: "noSchedule",
          targetDate: "2026-10-10",
          timeZone: "Asia/Tokyo",
        })}
        onEditTomorrow={jest.fn()}
        onStartMorning={jest.fn()}
      />,
    );
    await waitFor(() => screen.getByText("明日の予定はありません"));
  });

  it("can retry after a local database error", async () => {
    const retryRequest = deferred<HomeDashboardData>();
    const loadPlan = jest
      .fn<Promise<HomeDashboardData>, []>()
      .mockRejectedValueOnce(new Error("database unavailable"))
      .mockReturnValueOnce(retryRequest.promise);
    const screen = await render(
      <HomeScreen
        loadPlan={loadPlan}
        onEditTomorrow={jest.fn()}
        onStartMorning={jest.fn()}
      />,
    );
    await waitFor(() => screen.getByRole("button", { name: "もう一度試す" }));
    await fireEvent.press(screen.getByRole("button", { name: "もう一度試す" }));
    await waitFor(() => expect(loadPlan).toHaveBeenCalledTimes(2));
    await act(async () => {
      retryRequest.resolve(plannedPreview);
      await retryRequest.promise;
    });
    await waitFor(() =>
      expect(screen.getByText("10月10日（土）")).toBeTruthy(),
    );
  });

  it("offers to resume today's active session", async () => {
    const onStartMorning = jest.fn();
    const screen = await render(
      <HomeScreen
        loadPlan={jest.fn().mockResolvedValue({
          kind: "morningSession",
          timeZone: "Asia/Tokyo",
          session: {
            id: "session-active",
            targetDate: "2026-10-10",
            firstEventTitle: "1限 英語",
            firstEventStartAt: new Date("2026-10-09T23:50:00.000Z"),
            plannedWakeAt: new Date("2026-10-09T22:25:00.000Z"),
            latestDepartureAt: new Date("2026-10-09T23:10:00.000Z"),
            status: "active",
            lateByMin: 0,
            createdAt: new Date("2026-10-09T12:00:00.000Z"),
            updatedAt: new Date("2026-10-09T22:30:00.000Z"),
          },
        })}
        onEditTomorrow={jest.fn()}
        onStartMorning={onStartMorning}
      />,
    );
    await waitFor(() => screen.getByRole("button", { name: "朝プランを再開" }));
    fireEvent.press(screen.getByRole("button", { name: "朝プランを再開" }));
    expect(onStartMorning).toHaveBeenCalledWith("session-active");
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
