import { z } from "zod";

import { ValidationError } from "@/application/errors/validation-error";
import type { ScheduleRepository } from "@/application/ports/repositories";
import type { WeekdaySchedule } from "@/application/schedule";

const weekdayInputSchema = z.object({
  weekday: z.number().int().min(0).max(6),
  hasSchedule: z.boolean(),
  title: z.string().trim().max(80),
  startTime: z.string().trim(),
  locationLabel: z.string().trim().max(100).optional(),
});

const inputSchema = z
  .array(weekdayInputSchema)
  .length(7)
  .superRefine((days, context) => {
    if (new Set(days.map(({ weekday }) => weekday)).size !== 7) {
      context.addIssue({ code: "custom", message: "曜日が重複しています。" });
    }
    days.forEach((day, index) => {
      if (!day.hasSchedule) return;
      if (!day.title || !/^([01]\d|2[0-3]):[0-5]\d$/.test(day.startTime)) {
        context.addIssue({
          code: "custom",
          message: "予定名と開始時刻を確認してください。",
          path: [index],
        });
      }
    });
  });

export type WeekdayScheduleSetupInput = z.input<typeof weekdayInputSchema>;

export type SaveWeekdaySchedulesDependencies = Readonly<{
  repository: ScheduleRepository;
  routeId: string;
  createId: () => string;
}>;

export async function saveWeekdaySchedules(
  input: readonly WeekdayScheduleSetupInput[],
  dependencies: SaveWeekdaySchedulesDependencies,
): Promise<readonly WeekdaySchedule[]> {
  const result = inputSchema.safeParse(input);
  if (!result.success) {
    throw new ValidationError("曜日予定の入力内容を確認してください。");
  }

  const schedules = result.data
    .filter(({ hasSchedule }) => hasSchedule)
    .map<WeekdaySchedule>((day) => ({
      id: dependencies.createId(),
      weekday: day.weekday,
      title: day.title,
      startTime: day.startTime,
      locationLabel: day.locationLabel || undefined,
      routeId: dependencies.routeId,
      isActive: true,
    }));

  await dependencies.repository.replaceWeekdaySchedules(schedules);
  return schedules;
}
