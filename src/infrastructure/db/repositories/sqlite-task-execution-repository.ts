import { z } from "zod";

import type {
  MorningTaskExecution,
  MorningTaskExecutionRepository,
} from "@/application/ports/repositories";

import type { MutationDatabase, WriteDatabase } from "../query-database";
import {
  isoDateTimeSchema,
  nullableDateTimeSchema,
  parseDatabaseRow,
  runRepositoryQuery,
} from "./row-validation";

const executionRowSchema = z.object({
  id: z.string().min(1),
  session_id: z.string().min(1),
  task_template_id: z.string().min(1),
  sort_order: z.number().int().min(0),
  planned_duration_min: z.number().int().min(0),
  action: z.enum(["normal", "compressed", "skipped"]),
  planned_start_at: nullableDateTimeSchema,
  planned_end_at: nullableDateTimeSchema,
  actual_start_at: nullableDateTimeSchema,
  actual_end_at: nullableDateTimeSchema,
  status: z.enum(["pending", "active", "completed", "skipped"]),
  created_at: isoDateTimeSchema,
  updated_at: isoDateTimeSchema,
});

function mapExecution(row: unknown): MorningTaskExecution {
  const value = parseDatabaseRow(executionRowSchema, row, "朝タスク実行");
  return {
    id: value.id,
    sessionId: value.session_id,
    taskTemplateId: value.task_template_id,
    sortOrder: value.sort_order,
    plannedDurationMin: value.planned_duration_min,
    plannedAction: value.action,
    plannedStartAt: value.planned_start_at,
    plannedEndAt: value.planned_end_at,
    actualStartAt: value.actual_start_at,
    actualEndAt: value.actual_end_at,
    status: value.status,
    createdAt: value.created_at,
    updatedAt: value.updated_at,
  };
}

export class SQLiteMorningTaskExecutionRepository implements MorningTaskExecutionRepository {
  constructor(private readonly database: MutationDatabase) {}

  replaceForSession(
    sessionId: string,
    executions: readonly MorningTaskExecution[],
  ): Promise<void> {
    return runRepositoryQuery(() =>
      this.database.withExclusiveTransactionAsync(async (transaction) => {
        await transaction.runAsync(
          "DELETE FROM morning_task_executions WHERE session_id = $sessionId",
          { $sessionId: sessionId },
        );
        for (const execution of executions) {
          await saveExecution(transaction, execution);
        }
      }),
    );
  }

  listForSession(sessionId: string): Promise<MorningTaskExecution[]> {
    return runRepositoryQuery(async () => {
      const rows = await this.database.getAllAsync(
        `SELECT * FROM morning_task_executions WHERE session_id = $sessionId
         ORDER BY sort_order ASC, id ASC`,
        { $sessionId: sessionId },
      );
      return rows.map(mapExecution);
    });
  }

  save(execution: MorningTaskExecution): Promise<void> {
    return runRepositoryQuery(async () =>
      saveExecution(this.database, execution),
    );
  }
}

async function saveExecution(
  database: WriteDatabase,
  execution: MorningTaskExecution,
): Promise<void> {
  await database.runAsync(
    `INSERT INTO morning_task_executions (
      id, session_id, task_template_id, sort_order, planned_duration_min,
      action, planned_start_at, planned_end_at, actual_start_at, actual_end_at,
      status, created_at, updated_at
    ) VALUES (
      $id, $sessionId, $taskTemplateId, $sortOrder, $plannedDurationMin,
      $action, $plannedStartAt, $plannedEndAt, $actualStartAt, $actualEndAt,
      $status, $createdAt, $updatedAt
    ) ON CONFLICT(id) DO UPDATE SET
      sort_order = excluded.sort_order,
      planned_duration_min = excluded.planned_duration_min,
      action = excluded.action,
      planned_start_at = excluded.planned_start_at,
      planned_end_at = excluded.planned_end_at,
      actual_start_at = excluded.actual_start_at,
      actual_end_at = excluded.actual_end_at,
      status = excluded.status,
      updated_at = excluded.updated_at`,
    {
      $id: execution.id,
      $sessionId: execution.sessionId,
      $taskTemplateId: execution.taskTemplateId,
      $sortOrder: execution.sortOrder,
      $plannedDurationMin: execution.plannedDurationMin,
      $action: execution.plannedAction,
      $plannedStartAt: execution.plannedStartAt?.toISOString() ?? null,
      $plannedEndAt: execution.plannedEndAt?.toISOString() ?? null,
      $actualStartAt: execution.actualStartAt?.toISOString() ?? null,
      $actualEndAt: execution.actualEndAt?.toISOString() ?? null,
      $status: execution.status,
      $createdAt: execution.createdAt.toISOString(),
      $updatedAt: execution.updatedAt.toISOString(),
    },
  );
}
