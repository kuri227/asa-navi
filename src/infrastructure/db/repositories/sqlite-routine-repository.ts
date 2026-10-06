import { z } from "zod";

import type {
  PersistedMorningTaskTemplate,
  RoutineRepository,
} from "@/application/ports/repositories";
import type { MorningTaskTemplate } from "@/domain/planning";

import type { QueryDatabase } from "../query-database";
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
  constructor(private readonly database: QueryDatabase) {}

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
}
