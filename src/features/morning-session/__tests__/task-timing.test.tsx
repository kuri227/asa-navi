import { act, render } from "@testing-library/react-native";
import { AppState, type AppStateStatus } from "react-native";
import { TaskTiming } from "../task-timing";

describe("TaskTiming", () => {
  const now = new Date("2026-10-12T22:00:00Z");
  const originalState = AppState.currentState;
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(now);
    AppState.currentState = "active";
  });
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    AppState.currentState = originalState;
  });

  it("counts from absolute time and marks the task overdue without hiding completion", async () => {
    const clearTimer = jest.spyOn(globalThis, "clearInterval");
    const screen = await render(
      <TaskTiming
        startedAt={now}
        durationMin={1}
        latestDepartureAt={new Date("2026-10-12T22:10:00Z")}
        timeZone="Asia/Tokyo"
      />,
    );
    expect(screen.getByText("1:00")).toBeTruthy();
    expect(screen.getByText("現在時刻 07:00")).toBeTruthy();
    await act(async () => jest.advanceTimersByTime(65_000));
    expect(screen.getByText("タスクの目安を超過")).toBeTruthy();
    expect(screen.getByText("0:05")).toBeTruthy();
    expect(screen.getByText("最終出発まで 8:55")).toBeTruthy();
    await screen.unmount();
    expect(clearTimer).toHaveBeenCalledTimes(1);
  });

  it("pauses in the background and catches up on resume instead of decrementing ticks", async () => {
    const clearTimer = jest.spyOn(globalThis, "clearInterval");
    let changeState: (state: AppStateStatus) => void = () => undefined;
    const remove = jest.fn();
    jest
      .spyOn(AppState, "addEventListener")
      .mockImplementation((_type, listener) => {
        changeState = listener;
        return { remove };
      });
    const screen = await render(
      <TaskTiming
        startedAt={now}
        durationMin={10}
        latestDepartureAt={new Date("2026-10-12T22:10:00Z")}
        timeZone="Asia/Tokyo"
      />,
    );
    await act(async () => changeState("background"));
    expect(clearTimer).toHaveBeenCalledTimes(1);
    jest.setSystemTime(new Date("2026-10-12T22:05:00Z"));
    await act(async () => changeState("active"));
    expect(screen.getByText("5:00")).toBeTruthy();
    await screen.unmount();
    expect(remove).toHaveBeenCalledTimes(1);
    expect(clearTimer).toHaveBeenCalledTimes(2);
  });
});
