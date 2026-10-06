import { z } from "zod";

import type {
  AlarmRecord,
  AlarmRecordRepository,
} from "@/application/ports/repositories";

import type { MutationDatabase, WriteDatabase } from "../query-database";
import {
  isoDateTimeSchema,
  nullableStringSchema,
  parseDatabaseRow,
  runRepositoryQuery,
} from "./row-validation";

const alarmRowSchema = z.object({
  id: z.string().min(1),
  session_id: z.string().min(1),
  scheduled_at: isoDateTimeSchema,
  platform_notification_id: nullableStringSchema,
  status: z.enum(["scheduled", "triggered", "cancelled", "failed"]),
  created_at: isoDateTimeSchema,
  updated_at: isoDateTimeSchema,
});

function mapAlarmRecord(row: unknown): AlarmRecord {
  const value = parseDatabaseRow(alarmRowSchema, row, "アラーム記録");
  return {
    id: value.id,
    sessionId: value.session_id,
    scheduledAt: value.scheduled_at,
    platformNotificationId: value.platform_notification_id,
    status: value.status,
    createdAt: value.created_at,
    updatedAt: value.updated_at,
  };
}

export class SQLiteAlarmRecordRepository implements AlarmRecordRepository {
  constructor(private readonly database: MutationDatabase) {}

  create(record: AlarmRecord): Promise<void> {
    return runRepositoryQuery(async () =>
      insertAlarmRecord(this.database, record),
    );
  }

  listBySessionId(sessionId: string): Promise<AlarmRecord[]> {
    return runRepositoryQuery(async () => {
      const rows = await this.database.getAllAsync(
        `SELECT * FROM alarm_records WHERE session_id = $sessionId
         ORDER BY scheduled_at ASC, id ASC`,
        { $sessionId: sessionId },
      );
      return rows.map(mapAlarmRecord);
    });
  }

  save(record: AlarmRecord): Promise<void> {
    return runRepositoryQuery(async () => {
      await this.database.runAsync(
        `UPDATE alarm_records SET
          scheduled_at = $scheduledAt,
          platform_notification_id = $platformNotificationId,
          status = $status,
          updated_at = $updatedAt
         WHERE id = $id`,
        toAlarmParams(record),
      );
    });
  }
}

async function insertAlarmRecord(
  database: WriteDatabase,
  record: AlarmRecord,
): Promise<void> {
  await database.runAsync(
    `INSERT INTO alarm_records (
      id, session_id, scheduled_at, platform_notification_id,
      status, created_at, updated_at
    ) VALUES (
      $id, $sessionId, $scheduledAt, $platformNotificationId,
      $status, $createdAt, $updatedAt
    )`,
    toAlarmParams(record),
  );
}

function toAlarmParams(record: AlarmRecord) {
  return {
    $id: record.id,
    $sessionId: record.sessionId,
    $scheduledAt: record.scheduledAt.toISOString(),
    $platformNotificationId: record.platformNotificationId ?? null,
    $status: record.status,
    $createdAt: record.createdAt.toISOString(),
    $updatedAt: record.updatedAt.toISOString(),
  };
}
