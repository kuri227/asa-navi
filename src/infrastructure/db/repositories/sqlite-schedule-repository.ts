import { z } from "zod";

import type { ScheduleRepository } from "@/application/ports/repositories";
import type {
  DateScheduleOverride,
  WeekdaySchedule,
} from "@/application/schedule";

import type { QueryDatabase } from "../query-database";
import {
  nullableStringSchema,
  parseDatabaseRow,
  runRepositoryQuery,
} from "./row-validation";

const weekdayScheduleRowSchema = z.object({
  id: z.string().min(1),
  weekday: z.number().int().min(0).max(6),
  title: z.string().min(1),
  start_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  location_label: nullableStringSchema,
  route_id: nullableStringSchema,
  is_active: z.union([z.literal(0), z.literal(1)]).transform(Boolean),
});

const overrideBaseSchema = z.object({
  id: z.string().min(1),
  target_date: z.iso.date(),
  location_label: nullableStringSchema,
  route_id: nullableStringSchema,
});

const overrideRowSchema = z.discriminatedUnion("override_type", [
  overrideBaseSchema.extend({
    override_type: z.literal("cancel"),
    title: z.string().nullable(),
    start_time: z.string().nullable(),
  }),
  overrideBaseSchema.extend({
    override_type: z.literal("replace"),
    title: z.string().min(1),
    start_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  }),
]);

export class SQLiteScheduleRepository implements ScheduleRepository {
  constructor(private readonly database: QueryDatabase) {}

  getWeekdaySchedule(weekday: number): Promise<WeekdaySchedule | null> {
    return runRepositoryQuery(async () => {
      const row = await this.database.getFirstAsync(
        `SELECT id, weekday, title, start_time, location_label, route_id, is_active
         FROM weekday_schedules
         WHERE weekday = $weekday AND is_active = 1
         ORDER BY start_time ASC, id ASC
         LIMIT 1`,
        { $weekday: weekday },
      );
      if (row === null) return null;
      const value = parseDatabaseRow(weekdayScheduleRowSchema, row, "曜日予定");
      return {
        id: value.id,
        weekday: value.weekday,
        title: value.title,
        startTime: value.start_time,
        locationLabel: value.location_label,
        routeId: value.route_id,
        isActive: value.is_active,
      };
    });
  }

  getOverride(targetDate: string): Promise<DateScheduleOverride | null> {
    return runRepositoryQuery(async () => {
      const row = await this.database.getFirstAsync(
        `SELECT id, target_date, override_type, title, start_time, location_label, route_id
         FROM date_schedule_overrides WHERE target_date = $targetDate LIMIT 1`,
        { $targetDate: targetDate },
      );
      if (row === null) return null;
      const value = parseDatabaseRow(overrideRowSchema, row, "日付例外");
      if (value.override_type === "cancel") {
        return {
          id: value.id,
          targetDate: value.target_date,
          overrideType: "cancel",
        };
      }
      return {
        id: value.id,
        targetDate: value.target_date,
        overrideType: "replace",
        title: value.title,
        startTime: value.start_time,
        locationLabel: value.location_label,
        routeId: value.route_id,
      };
    });
  }
}
