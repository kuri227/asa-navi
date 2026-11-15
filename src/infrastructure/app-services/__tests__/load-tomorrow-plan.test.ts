import { getTomorrowTargetDate } from "../target-date";
import { loadHomeDashboardFromDatabase } from "../load-tomorrow-plan";

import { loadTomorrowPlan } from "@/application/tomorrow-plan";
import { syncMorningAlarm } from "@/application/alarms";

const mockUpdateStatus = jest.fn();
const mockFindActive = jest.fn();
const mockClose = jest.fn();

jest.mock("@/infrastructure/db/open-database", () => ({
  openAppDatabase: async () => ({ closeAsync: mockClose }),
}));
jest.mock("@/infrastructure/db/query-database", () => ({
  createMutationDatabase: jest.fn(),
}));
jest.mock("@/infrastructure/db/repositories", () => ({
  SQLiteMorningSessionRepository: function () {
    return { findActive: mockFindActive, updateStatus: mockUpdateStatus };
  },
  SQLiteAlarmRecordRepository: jest.fn(),
  SQLiteRouteRepository: jest.fn(),
  SQLiteRoutineRepository: jest.fn(),
  SQLiteScheduleRepository: jest.fn(),
  SQLiteSettingsRepository: jest.fn(),
}));
jest.mock("@/application/tomorrow-plan", () => ({
  loadTomorrowPlan: jest.fn(),
}));
jest.mock("@/application/alarms", () => ({ syncMorningAlarm: jest.fn() }));
jest.mock(
  "@/infrastructure/notifications/expo-notification-alarm-service",
  () => ({
    ExpoNotificationAlarmService: jest.fn(),
  }),
);

it("keeps cancellation retryable when the OS fails to remove an alarm", async () => {
  const session = { id: "tomorrow", status: "planned" } as const;
  const preview = {
    kind: "noSchedule",
    targetDate: "2026-11-16",
    timeZone: "Asia/Tokyo",
  } as const;
  jest.mocked(loadTomorrowPlan).mockResolvedValue(preview);
  mockFindActive
    .mockResolvedValueOnce(null)
    .mockResolvedValueOnce(session)
    .mockResolvedValueOnce(null)
    .mockResolvedValueOnce(session);
  jest
    .mocked(syncMorningAlarm)
    .mockRejectedValueOnce(new Error("OS cancellation failed"))
    .mockResolvedValueOnce({ state: "notScheduled" });

  await expect(loadHomeDashboardFromDatabase()).rejects.toThrow(
    "OS cancellation failed",
  );
  expect(mockUpdateStatus).not.toHaveBeenCalled();

  await expect(loadHomeDashboardFromDatabase()).resolves.toBe(preview);
  expect(syncMorningAlarm).toHaveBeenCalledTimes(2);
  expect(mockUpdateStatus).toHaveBeenCalledTimes(1);
  expect(mockUpdateStatus).toHaveBeenCalledWith("tomorrow", "cancelled");
  expect(mockClose).toHaveBeenCalledTimes(2);
});

describe("getTomorrowTargetDate", () => {
  it("uses the device time zone across a UTC date boundary", () => {
    expect(
      getTomorrowTargetDate(new Date("2026-10-08T16:30:00.000Z"), "Asia/Tokyo"),
    ).toBe("2026-10-10");
  });

  it("handles a month boundary", () => {
    expect(
      getTomorrowTargetDate(new Date("2026-10-31T03:00:00.000Z"), "Asia/Tokyo"),
    ).toBe("2026-11-01");
  });
});
