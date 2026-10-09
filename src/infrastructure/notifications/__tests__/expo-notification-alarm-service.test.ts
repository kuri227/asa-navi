import { NotificationError } from "@/application/errors/notification-error";
import { FakeAlarmService } from "@/application/ports/notifications/testing";

import { ExpoNotificationAlarmService } from "../expo-notification-alarm-service";

jest.mock("expo-notifications", () => ({
  AndroidNotificationPriority: { MAX: "max" },
  SchedulableTriggerInputTypes: { DATE: "date" },
  cancelScheduledNotificationAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
}));

describe("ExpoNotificationAlarmService", () => {
  const fireAt = new Date("2026-10-10T06:45:00+09:00");

  it("schedules a dated local notification with its session deep link", async () => {
    const schedule = jest.fn().mockResolvedValue("notification-1");
    const service = new ExpoNotificationAlarmService(
      { schedule, cancel: jest.fn() },
      new FakeAlarmService({ initialPermissionState: "granted" }),
      "android",
    );

    await expect(
      service.schedule({
        sessionId: "session / 1",
        fireAt,
        title: "朝ナビ",
        body: "起きる時間です",
      }),
    ).resolves.toEqual({ alarmId: "notification-1" });

    expect(schedule).toHaveBeenCalledWith({
      content: {
        title: "朝ナビ",
        body: "起きる時間です",
        sound: "default",
        priority: "max",
        data: {
          type: "morning-alarm",
          sessionId: "session / 1",
          url: "/morning/start?sessionId=session%20%2F%201",
        },
      },
      trigger: {
        type: "date",
        date: fireAt,
        channelId: "morning-alarm",
      },
    });
  });

  it("cancels the scheduled notification identifier", async () => {
    const cancel = jest.fn().mockResolvedValue(undefined);
    const service = new ExpoNotificationAlarmService(
      { schedule: jest.fn(), cancel },
      new FakeAlarmService(),
      "ios",
    );

    await service.cancel("notification-1");

    expect(cancel).toHaveBeenCalledWith("notification-1");
  });

  it("delegates permission state to the existing permission service", async () => {
    const permissionService = new FakeAlarmService({
      initialPermissionState: "notDetermined",
      requestPermissionResult: "granted",
    });
    const service = new ExpoNotificationAlarmService(
      { schedule: jest.fn(), cancel: jest.fn() },
      permissionService,
      "ios",
    );

    await expect(service.getPermissionState()).resolves.toBe("notDetermined");
    await expect(service.requestPermission()).resolves.toBe("granted");
  });

  it("wraps scheduling failures in NotificationError", async () => {
    const service = new ExpoNotificationAlarmService(
      {
        schedule: jest.fn().mockRejectedValue(new Error("native failure")),
        cancel: jest.fn(),
      },
      new FakeAlarmService(),
      "android",
    );

    await expect(
      service.schedule({
        sessionId: "session-1",
        fireAt,
        title: "朝ナビ",
        body: "起きる時間です",
      }),
    ).rejects.toBeInstanceOf(NotificationError);
  });

  it("rejects scheduling on web without calling native APIs", async () => {
    const schedule = jest.fn();
    const service = new ExpoNotificationAlarmService(
      { schedule, cancel: jest.fn() },
      new FakeAlarmService(),
      "web",
    );

    await expect(
      service.schedule({
        sessionId: "session-1",
        fireAt,
        title: "朝ナビ",
        body: "起きる時間です",
      }),
    ).rejects.toThrow("Webでは起床通知を予約できません");
    expect(schedule).not.toHaveBeenCalled();
  });
});
