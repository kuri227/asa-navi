import { FakeAlarmService } from "../fake-alarm-service";

describe("FakeAlarmService", () => {
  it("captures scheduled alarms with deterministic identifiers", async () => {
    const service = new FakeAlarmService({
      initialPermissionState: "granted",
      createAlarmId: () => "alarm-1",
    });
    const fireAt = new Date("2026-10-10T06:45:00+09:00");

    await expect(
      service.schedule({
        sessionId: "session-1",
        fireAt,
        title: "朝ナビ",
        body: "起きる時間です",
      }),
    ).resolves.toEqual({ alarmId: "alarm-1" });

    expect(service.getScheduledAlarms()).toEqual([
      {
        alarmId: "alarm-1",
        input: {
          sessionId: "session-1",
          fireAt,
          title: "朝ナビ",
          body: "起きる時間です",
        },
      },
    ]);
  });

  it("removes a cancelled alarm and preserves the cancellation call", async () => {
    const service = new FakeAlarmService({ createAlarmId: () => "alarm-1" });
    await service.schedule({
      sessionId: "session-1",
      fireAt: new Date("2026-10-10T06:45:00+09:00"),
      title: "朝ナビ",
      body: "起きる時間です",
    });

    await service.cancel("alarm-1");

    expect(service.getScheduledAlarms()).toEqual([]);
    expect(service.getCancelledAlarmIds()).toEqual(["alarm-1"]);
  });

  it("models the permission result returned by the platform", async () => {
    const service = new FakeAlarmService({
      initialPermissionState: "notDetermined",
      requestPermissionResult: "denied",
    });

    await expect(service.getPermissionState()).resolves.toBe("notDetermined");
    await expect(service.requestPermission()).resolves.toBe("denied");
    await expect(service.getPermissionState()).resolves.toBe("denied");
  });
});
