import { act, fireEvent, render, waitFor } from "@testing-library/react-native";

import type { ActiveMorningSession } from "@/application/morning-session";

import { MorningStartScreen } from "../morning-start-screen";

const timestamp = new Date("2026-10-09T22:30:00.000Z");
const activeSession: ActiveMorningSession = {
  optionalTaskIds: [],
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
        completeTask={jest.fn()}
        onBackHome={jest.fn()}
        skipTask={jest.fn()}
        startSession={jest.fn().mockResolvedValue(activeSession)}
        timeZone="Asia/Tokyo"
      />,
    );
    await waitFor(() => screen.getByText("今日の朝プラン"));
    expect(screen.getByText("08:00")).toBeTruthy();
    expect(screen.getAllByText("朝食")).toHaveLength(2);
    expect(screen.getByText("目安 15分")).toBeTruthy();
    expect(screen.getByText("予定より5分遅い起床です")).toBeTruthy();
    expect(screen.getByText("このプランなら10分の余裕があります")).toBeTruthy();
    expect(screen.getByRole("button", { name: "完了しました" })).toBeTruthy();
    expect(
      screen.queryByRole("button", { name: "このタスクを省略" }),
    ).toBeNull();
  });

  it("completes the current task and displays the replanned next task", async () => {
    const nextSession: ActiveMorningSession = {
      ...activeSession,
      executions: [
        { ...activeSession.executions[0], status: "completed" },
        {
          ...activeSession.executions[0],
          id: "execution-2",
          taskTemplateId: "packing",
          sortOrder: 1,
          plannedDurationMin: 5,
          status: "active",
        },
      ],
      plan: {
        ...activeSession.plan,
        tasks: [
          {
            taskId: "packing",
            name: "持ち物確認",
            plannedDurationMin: 5,
            action: "normal",
          },
        ],
      },
    };
    const completeTask = jest.fn().mockResolvedValue(nextSession);
    const screen = await render(
      <MorningStartScreen
        completeTask={completeTask}
        onBackHome={jest.fn()}
        skipTask={jest.fn()}
        startSession={jest.fn().mockResolvedValue(activeSession)}
        timeZone="Asia/Tokyo"
      />,
    );
    await waitFor(() => screen.getByRole("button", { name: "完了しました" }));
    await act(async () => {
      fireEvent.press(screen.getByRole("button", { name: "完了しました" }));
    });
    await waitFor(() => screen.getAllByText("持ち物確認"));
    expect(completeTask).toHaveBeenCalledWith("execution-1");
  });

  it("allows an optional current task to be skipped", async () => {
    const completedSession: ActiveMorningSession = {
      ...activeSession,
      optionalTaskIds: ["breakfast"],
      session: { ...activeSession.session, status: "completed" },
      executions: [{ ...activeSession.executions[0], status: "skipped" }],
      plan: { ...activeSession.plan, tasks: [] },
    };
    const skipTask = jest.fn().mockResolvedValue(completedSession);
    const screen = await render(
      <MorningStartScreen
        completeTask={jest.fn()}
        onBackHome={jest.fn()}
        skipTask={skipTask}
        startSession={jest.fn().mockResolvedValue({
          ...activeSession,
          optionalTaskIds: ["breakfast"],
        })}
        timeZone="Asia/Tokyo"
      />,
    );
    await waitFor(() =>
      screen.getByRole("button", { name: "このタスクを省略" }),
    );
    await act(async () => {
      fireEvent.press(screen.getByRole("button", { name: "このタスクを省略" }));
    });
    await waitFor(() => screen.getByText("朝の準備が完了しました"));
    expect(skipTask).toHaveBeenCalledWith("execution-1");
    expect(screen.queryByRole("button", { name: "完了しました" })).toBeNull();
  });

  it("keeps the current task visible when saving progress fails", async () => {
    const screen = await render(
      <MorningStartScreen
        completeTask={jest.fn().mockRejectedValue(new Error("database busy"))}
        onBackHome={jest.fn()}
        skipTask={jest.fn()}
        startSession={jest.fn().mockResolvedValue(activeSession)}
        timeZone="Asia/Tokyo"
      />,
    );
    await waitFor(() => screen.getByRole("button", { name: "完了しました" }));
    await act(async () => {
      fireEvent.press(screen.getByRole("button", { name: "完了しました" }));
    });
    await waitFor(() =>
      screen.getByText("進捗を保存できませんでした。もう一度お試しください。"),
    );
    expect(screen.getAllByText("朝食")).toHaveLength(2);
    expect(screen.getByRole("button", { name: "完了しました" })).toBeTruthy();
  });

  it("explains recovery adjustments and lateness in text", async () => {
    const screen = await render(
      <MorningStartScreen
        completeTask={jest.fn()}
        onBackHome={jest.fn()}
        skipTask={jest.fn()}
        startSession={jest.fn().mockResolvedValue({
          ...activeSession,
          session: {
            ...activeSession.session,
            planStatus: "late",
            lateByMin: 4,
          },
          plan: {
            ...activeSession.plan,
            slackMin: 0,
            lateByMin: 4,
            status: "late",
            adjustments: [
              {
                type: "compress",
                taskId: "breakfast",
                fromMin: 15,
                toMin: 8,
              },
              { type: "late", lateByMin: 4 },
            ],
          },
        })}
        timeZone="Asia/Tokyo"
      />,
    );
    await waitFor(() => screen.getByText("このプランでは4分遅れる見込みです"));
    expect(screen.getByText("遅れを取り戻すプラン")).toBeTruthy();
    expect(screen.getByText("・朝食を15分から8分に短縮")).toBeTruthy();
    expect(screen.getByText("このプランなら08:00に出発できます")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "完了しました" })).toBeNull();
    await act(async () => {
      fireEvent.press(screen.getByRole("button", { name: "このプランで進む" }));
    });
    expect(screen.getByText("このリカバリープランで進行中")).toBeTruthy();
    expect(screen.getByRole("button", { name: "完了しました" })).toBeTruthy();
  });

  it("offers retry and a safe way back after a restore error", async () => {
    const onBackHome = jest.fn();
    const screen = await render(
      <MorningStartScreen
        completeTask={jest.fn()}
        onBackHome={onBackHome}
        skipTask={jest.fn()}
        startSession={jest.fn().mockRejectedValue(new Error("missing"))}
        timeZone="Asia/Tokyo"
      />,
    );
    await waitFor(() => screen.getByRole("button", { name: "ホームへ戻る" }));
    fireEvent.press(screen.getByRole("button", { name: "ホームへ戻る" }));
    expect(onBackHome).toHaveBeenCalledTimes(1);
  });
});
