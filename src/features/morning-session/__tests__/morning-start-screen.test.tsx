import { fireEvent, render, waitFor } from "@testing-library/react-native";

import type { ActiveMorningSession } from "@/application/morning-session";

import { MorningStartScreen } from "../morning-start-screen";

const timestamp = new Date("2026-10-09T22:30:00.000Z");
const activeSession: ActiveMorningSession = {
  session: {
    id: "session-1",
    targetDate: "2026-10-10",
    firstEventTitle: "1限",
    firstEventStartAt: new Date("2026-10-09T23:50:00.000Z"),
    plannedWakeAt: new Date("2026-10-09T22:25:00.000Z"),
    actualWakeAt: timestamp,
    latestDepartureAt: new Date("2026-10-09T23:10:00.000Z"),
    predictedDepartureAt: new Date("2026-10-09T23:00:00.000Z"),
    predictedArrivalAt: new Date("2026-10-09T23:40:00.000Z"),
    status: "active",
    planStatus: "comfortable",
    lateByMin: 0,
    createdAt: timestamp,
    updatedAt: timestamp,
  },
  executions: [
    {
      id: "execution-1",
      sessionId: "session-1",
      taskTemplateId: "breakfast",
      sortOrder: 0,
      plannedDurationMin: 15,
      plannedAction: "normal",
      status: "active",
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  ],
  plan: {
    recommendedWakeAt: new Date("2026-10-09T22:25:00.000Z"),
    latestDepartureAt: new Date("2026-10-09T23:10:00.000Z"),
    predictedDepartureAt: new Date("2026-10-09T23:00:00.000Z"),
    predictedArrivalAt: new Date("2026-10-09T23:40:00.000Z"),
    slackMin: 10,
    lateByMin: 0,
    status: "comfortable",
    tasks: [
      {
        taskId: "breakfast",
        name: "朝食",
        plannedDurationMin: 15,
        action: "normal",
      },
    ],
    adjustments: [],
  },
};

describe("MorningStartScreen", () => {
  it("shows the recalculated departure and first active task", async () => {
    const screen = await render(
      <MorningStartScreen
        onBackHome={jest.fn()}
        startSession={jest.fn().mockResolvedValue(activeSession)}
        timeZone="Asia/Tokyo"
      />,
    );
    await waitFor(() => screen.getByText("朝プランを開始しました"));
    expect(screen.getByText("08:00")).toBeTruthy();
    expect(screen.getByText("朝食")).toBeTruthy();
    expect(screen.getByText("目安 15分")).toBeTruthy();
  });

  it("offers retry and a safe way back after a restore error", async () => {
    const onBackHome = jest.fn();
    const screen = await render(
      <MorningStartScreen
        onBackHome={onBackHome}
        startSession={jest.fn().mockRejectedValue(new Error("missing"))}
        timeZone="Asia/Tokyo"
      />,
    );
    await waitFor(() => screen.getByRole("button", { name: "ホームへ戻る" }));
    fireEvent.press(screen.getByRole("button", { name: "ホームへ戻る" }));
    expect(onBackHome).toHaveBeenCalledTimes(1);
  });
});
