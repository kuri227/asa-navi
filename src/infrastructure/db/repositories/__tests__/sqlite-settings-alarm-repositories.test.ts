import type { SQLiteBindParams } from "expo-sqlite";

import type { AlarmRecord } from "@/application/ports/repositories";

import type { MutationDatabase, WriteDatabase } from "../../query-database";
import { SQLiteAlarmRecordRepository } from "../sqlite-alarm-record-repository";
import { SQLiteSettingsRepository } from "../sqlite-settings-repository";

class FakeMutationDatabase implements MutationDatabase {
  readonly runCalls: { sql: string; params?: SQLiteBindParams }[] = [];

  constructor(
    private readonly firstRows: unknown[] = [],
    private readonly allRows: unknown[][] = [],
  ) {}

  async getFirstAsync<T>(
    _sql: string,
    _params?: SQLiteBindParams,
  ): Promise<T | null> {
    return (this.firstRows.shift() ?? null) as T | null;
  }

  async getAllAsync<T>(_sql: string, _params?: SQLiteBindParams): Promise<T[]> {
    return (this.allRows.shift() ?? []) as T[];
  }

  async runAsync(sql: string, params?: SQLiteBindParams): Promise<void> {
    this.runCalls.push({ sql, params });
  }

  async withExclusiveTransactionAsync(
    task: (transaction: WriteDatabase) => Promise<void>,
  ): Promise<void> {
    await task(this);
  }
}

const timestamp = "2026-10-06T00:00:00.000Z";

describe("SQLiteSettingsRepository", () => {
  it("persists defaults before returning settings for a new database", async () => {
    const database = new FakeMutationDatabase([
      {
        arrival_buffer_min: 10,
        tight_threshold_min: 10,
        onboarding_completed: 0,
        created_at: timestamp,
        updated_at: timestamp,
      },
    ]);

    const settings = await new SQLiteSettingsRepository(
      database,
      () => new Date(timestamp),
    ).get();

    expect(database.runCalls[0].sql).toContain(
      "INSERT OR IGNORE INTO app_settings",
    );
    expect(settings).toMatchObject({
      arrivalBufferMin: 10,
      tightThresholdMin: 10,
      onboardingCompleted: false,
    });
  });
});

describe("SQLiteAlarmRecordRepository", () => {
  const alarm: AlarmRecord = {
    id: "alarm-1",
    sessionId: "session-1",
    scheduledAt: new Date("2026-10-05T21:30:00.000Z"),
    platformNotificationId: "notification-1",
    status: "scheduled",
    createdAt: new Date(timestamp),
    updatedAt: new Date(timestamp),
  };

  it("binds the platform notification identifier when creating", async () => {
    const database = new FakeMutationDatabase();

    await new SQLiteAlarmRecordRepository(database).create(alarm);

    expect(database.runCalls[0].params).toMatchObject({
      $id: "alarm-1",
      $platformNotificationId: "notification-1",
      $status: "scheduled",
    });
  });

  it("restores all alarm records for a session", async () => {
    const database = new FakeMutationDatabase(
      [],
      [
        [
          {
            id: "alarm-1",
            session_id: "session-1",
            scheduled_at: "2026-10-05T21:30:00.000Z",
            platform_notification_id: "notification-1",
            status: "scheduled",
            created_at: timestamp,
            updated_at: timestamp,
          },
        ],
      ],
    );

    const records = await new SQLiteAlarmRecordRepository(
      database,
    ).listBySessionId("session-1");

    expect(records[0]).toMatchObject({
      id: "alarm-1",
      platformNotificationId: "notification-1",
      status: "scheduled",
    });
    expect(records[0].scheduledAt).toEqual(
      new Date("2026-10-05T21:30:00.000Z"),
    );
  });
});
