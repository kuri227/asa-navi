import { z } from "zod";

import type {
  PersistedMorningTaskTemplate,
  RoutineRepository,
} from "@/application/ports/repositories";
import type { MorningTaskTemplate } from "@/domain/planning";

import type { MutationDatabase } from "../query-database";
import {
  booleanIntegerSchema,
  isoDateTimeSchema,
  nullableStringSchema,
  parseDatabaseRow,
  runRepositoryQuery,
} from "./row-validation";

const taskRowSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    normal_duration_min: z.number().int().min(1),
    minimum_duration_min: z.number().int().min(0),
    requirement: z.enum(["required", "optional"]),
    compression_priority: z.number().int(),
    skip_priority: z.number().int(),
    sort_order: z.number().int().min(0),
    enabled: booleanIntegerSchema,
    special_type: nullableStringSchema.pipe(
      z
        .enum(["meal", "bath", "grooming", "clothing", "belongings", "other"])
        .optional(),
    ),
    created_at: isoDateTimeSchema,
    updated_at: isoDateTimeSchema,
  })
  .refine((value) => value.minimum_duration_min <= value.normal_duration_min, {
    message: "minimum duration must not exceed normal duration",
  });

function mapPersistedTask(row: unknown): PersistedMorningTaskTemplate {
  const value = parseDatabaseRow(taskRowSchema, row, "朝タスク");
  return {
    id: value.id,
    name: value.name,
    normalDurationMin: value.normal_duration_min,
    minimumDurationMin: value.minimum_duration_min,
    requirement: value.requirement,
    compressionPriority: value.compression_priority,
    skipPriority: value.skip_priority,
    sortOrder: value.sort_order,
    enabled: value.enabled,
    specialType: value.special_type,
    createdAt: value.created_at,
    updatedAt: value.updated_at,
  };
}

function toPlanningTask(
  task: PersistedMorningTaskTemplate,
): MorningTaskTemplate {
  return {
    id: task.id,
    name: task.name,
    normalDurationMin: task.normalDurationMin,
    minimumDurationMin: task.minimumDurationMin,
    requirement: task.requirement,
    compressionPriority: task.compressionPriority,
    skipPriority: task.skipPriority,
    sortOrder: task.sortOrder,
    enabled: task.enabled,
  };
}

export class SQLiteRoutineRepository implements RoutineRepository {
  constructor(
    private readonly database: MutationDatabase,
    private readonly now: () => Date = () => new Date(),
  ) {}

  listEnabledTasks(): Promise<MorningTaskTemplate[]> {
    return runRepositoryQuery(async () => {
      const rows = await this.database.getAllAsync(
        `SELECT * FROM morning_task_templates WHERE enabled = 1
         ORDER BY sort_order ASC, id ASC`,
      );
      return rows.map(mapPersistedTask).map(toPlanningTask);
    });
  }

  listTaskTemplates(): Promise<PersistedMorningTaskTemplate[]> {
    return runRepositoryQuery(async () => {
      const rows = await this.database.getAllAsync(
        "SELECT * FROM morning_task_templates ORDER BY sort_order ASC, id ASC",
      );
      return rows.map(mapPersistedTask);
    });
  }

  replaceTaskTemplates(
    tasks: readonly PersistedMorningTaskTemplate[],
  ): Promise<void> {
    const updatedAt = this.now().toISOString();
    return runRepositoryQuery(() =>
      this.database.withExclusiveTransactionAsync(async (transaction) => {
        await transaction.runAsync("DELETE FROM morning_task_templates");
        for (const task of tasks) {
          await transaction.runAsync(
            `INSERT INTO morning_task_templates (
              id, name, normal_duration_min, minimum_duration_min,
              requirement, compression_priority, skip_priority, sort_order,
              enabled, special_type, created_at, updated_at
            ) VALUES (
              $id, $name, $normalDurationMin, $minimumDurationMin,
              $requirement, $compressionPriority, $skipPriority, $sortOrder,
              $enabled, $specialType, $createdAt, $updatedAt
            )`,
            {
              $id: task.id,
              $name: task.name,
              $normalDurationMin: task.normalDurationMin,
              $minimumDurationMin: task.minimumDurationMin,
              $requirement: task.requirement,
              $compressionPriority: task.compressionPriority,
              $skipPriority: task.skipPriority,
              $sortOrder: task.sortOrder,
              $enabled: task.enabled ? 1 : 0,
              $specialType: task.specialType ?? null,
              $createdAt: task.createdAt.toISOString(),
              $updatedAt: updatedAt,
            },
          );
        }
      }),
    );
  }
}
