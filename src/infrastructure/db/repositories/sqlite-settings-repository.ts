import { z } from "zod";

import type {
  AppSettings,
  SettingsRepository,
} from "@/application/ports/repositories";

import type { MutationDatabase } from "../query-database";
import {
  booleanIntegerSchema,
  isoDateTimeSchema,
  parseDatabaseRow,
  runRepositoryQuery,
} from "./row-validation";

const settingsRowSchema = z.object({
  arrival_buffer_min: z.number().int().min(0),
  tight_threshold_min: z.number().int().min(0),
  onboarding_completed: booleanIntegerSchema,
  created_at: isoDateTimeSchema,
  updated_at: isoDateTimeSchema,
});

export class SQLiteSettingsRepository implements SettingsRepository {
  constructor(
    private readonly database: MutationDatabase,
    private readonly now: () => Date = () => new Date(),
  ) {}

  get(): Promise<AppSettings> {
    return runRepositoryQuery(async () => {
      await this.database.runAsync(
        `INSERT OR IGNORE INTO app_settings (
          id, arrival_buffer_min, tight_threshold_min, onboarding_completed,
          created_at, updated_at
        ) VALUES (1, 10, 10, 0, $now, $now)`,
        { $now: this.now().toISOString() },
      );
      const row = await this.database.getFirstAsync(
        `SELECT arrival_buffer_min, tight_threshold_min, onboarding_completed,
                created_at, updated_at
         FROM app_settings WHERE id = 1`,
      );
      return mapSettings(row);
    });
  }

  save(settings: AppSettings): Promise<void> {
    return runRepositoryQuery(async () => {
      await this.database.runAsync(
        `INSERT INTO app_settings (
          id, arrival_buffer_min, tight_threshold_min, onboarding_completed,
          created_at, updated_at
        ) VALUES (1, $arrivalBufferMin, $tightThresholdMin, $onboardingCompleted,
                  $createdAt, $updatedAt)
        ON CONFLICT(id) DO UPDATE SET
          arrival_buffer_min = excluded.arrival_buffer_min,
          tight_threshold_min = excluded.tight_threshold_min,
          onboarding_completed = excluded.onboarding_completed,
          updated_at = excluded.updated_at`,
        {
          $arrivalBufferMin: settings.arrivalBufferMin,
          $tightThresholdMin: settings.tightThresholdMin,
          $onboardingCompleted: settings.onboardingCompleted ? 1 : 0,
          $createdAt: settings.createdAt.toISOString(),
          $updatedAt: settings.updatedAt.toISOString(),
        },
      );
    });
  }
}

function mapSettings(row: unknown): AppSettings {
  const value = parseDatabaseRow(settingsRowSchema, row, "アプリ設定");
  return {
    arrivalBufferMin: value.arrival_buffer_min,
    tightThresholdMin: value.tight_threshold_min,
    onboardingCompleted: value.onboarding_completed,
    createdAt: value.created_at,
    updatedAt: value.updated_at,
  };
}
