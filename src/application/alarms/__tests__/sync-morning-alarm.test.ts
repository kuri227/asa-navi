import { FakeAlarmService } from "@/application/ports/notifications/testing";
import type {
  AlarmRecord,
  AlarmRecordRepository,
  MorningSession,
} from "@/application/ports/repositories";

import { syncMorningAlarm } from "../sync-morning-alarm";

const now = new Date("2026-10-09T12:00:00.000Z");
const session: MorningSession = {
  id: "session-1",
  targetDate: "2026-10-10",
  firstEventTitle: "1限",
  firstEventStartAt: new Date("2026-10-09T23:50:00.000Z"),
  plannedWakeAt: new Date("2026-10-09T22:25:00.000Z"),
  latestDepartureAt: new Date("2026-10-09T23:10:00.000Z"),
  status: "planned",
  lateByMin: 0,
  createdAt: now,
  updatedAt: now,
};

describe("syncMorningAlarm", () => {
  it("schedules and records a future planned session", async () => {
    const alarmService = new FakeAlarmService({
      initialPermissionState: "granted",
      createAlarmId: () => "platform-1",
    });
    const repository = createRepository();

    const result = await syncMorningAlarm(
      { session, now },
      {
        alarmService,
        alarmRecordRepository: repository,
        createId: () => "record-1",
      },
    );

    expect(result).toMatchObject({ state: "scheduled" });
    expect(alarmService.getScheduledAlarms()[0].input).toMatchObject({
      sessionId: "session-1",
      fireAt: session.plannedWakeAt,
    });
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "record-1",
        platformNotificationId: "platform-1",
        status: "scheduled",
      }),
    );
  });

  it("cancels an old notification before rescheduling", async () => {
    const alarmService = new FakeAlarmService({
      initialPermissionState: "granted",
      createAlarmId: () => "platform-new",
    });
    const repository = createRepository([
      createRecord({
        platformNotificationId: "platform-old",
        scheduledAt: new Date("2026-10-09T22:00:00.000Z"),
      }),
    ]);

    await syncMorningAlarm(
      { session, now },
      {
        alarmService,
        alarmRecordRepository: repository,
        createId: () => "record-new",
      },
    );

    expect(alarmService.getCancelledAlarmIds()).toEqual(["platform-old"]);
    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({ status: "cancelled", updatedAt: now }),
    );
  });

  it("reuses the matching notification instead of rescheduling it", async () => {
    const alarmService = new FakeAlarmService({
      initialPermissionState: "granted",
    });
    const existingRecord = createRecord();
    const repository = createRepository([existingRecord]);

    await expect(
      syncMorningAlarm(
        { session, now },
        {
          alarmService,
          alarmRecordRepository: repository,
          createId: () => "unused",
        },
      ),
    ).resolves.toEqual({ state: "scheduled", record: existingRecord });
    expect(alarmService.getCancelledAlarmIds()).toEqual([]);
    expect(alarmService.getScheduledAlarms()).toEqual([]);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it("does not schedule when permission is unavailable", async () => {
    const alarmService = new FakeAlarmService({
      initialPermissionState: "denied",
    });
    const repository = createRepository();

    await expect(
      syncMorningAlarm(
        { session, now },
        {
          alarmService,
          alarmRecordRepository: repository,
          createId: () => "unused",
        },
      ),
    ).resolves.toEqual({ state: "permissionDenied" });
    expect(alarmService.getScheduledAlarms()).toEqual([]);
  });

  it("does not schedule a wake time that has already passed", async () => {
    const alarmService = new FakeAlarmService({
      initialPermissionState: "granted",
    });
    const repository = createRepository();

    await expect(
      syncMorningAlarm(
        { session: { ...session, plannedWakeAt: now }, now },
        {
          alarmService,
          alarmRecordRepository: repository,
          createId: () => "unused",
        },
      ),
    ).resolves.toEqual({ state: "notScheduled" });
  });

  it("records a failed scheduling attempt without hiding the plan", async () => {
    const alarmService = new FakeAlarmService({
      initialPermissionState: "granted",
    });
    alarmService.schedule = jest
      .fn()
      .mockRejectedValue(new Error("native failure"));
    const repository = createRepository();

    const result = await syncMorningAlarm(
      { session, now },
      {
        alarmService,
        alarmRecordRepository: repository,
        createId: () => "failed-1",
      },
    );

    expect(result).toMatchObject({ state: "failed" });
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({ id: "failed-1", status: "failed" }),
    );
  });

  it("compensates the OS alarm when saving its record fails", async () => {
    const alarmService = new FakeAlarmService({
      initialPermissionState: "granted",
      createAlarmId: () => "platform-1",
    });
    const repository = createRepository();
    jest
      .mocked(repository.create)
      .mockRejectedValue(new Error("database failure"));

    await expect(
      syncMorningAlarm(
        { session, now },
        {
          alarmService,
          alarmRecordRepository: repository,
          createId: () => "record-1",
        },
      ),
    ).rejects.toThrow("database failure");
    expect(alarmService.getCancelledAlarmIds()).toEqual(["platform-1"]);
  });
});

function createRepository(
  records: readonly AlarmRecord[] = [],
): AlarmRecordRepository {
  return {
    create: jest.fn(),
    listBySessionId: jest.fn().mockResolvedValue(records),
    save: jest.fn(),
  };
}

function createRecord(update: Partial<AlarmRecord> = {}): AlarmRecord {
  return {
    id: "record-old",
    sessionId: session.id,
    scheduledAt: session.plannedWakeAt,
    platformNotificationId: "platform-old",
    status: "scheduled",
    createdAt: now,
    updatedAt: now,
    ...update,
  };
}
