import { z } from "zod";

import { ValidationError } from "@/application/errors/validation-error";
import type { ScheduleRepository } from "@/application/ports/repositories";
import type { DateScheduleOverride } from "@/application/schedule";

const inputSchema = z.discriminatedUnion("overrideType", [
  z.object({ targetDate: z.iso.date(), overrideType: z.literal("cancel") }),
  z.object({
    targetDate: z.iso.date(),
    overrideType: z.literal("replace"),
    title: z.string().trim().min(1).max(80),
    startTime: z
      .string()
      .trim()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    locationLabel: z.string().trim().max(100).optional(),
  }),
]);

export type TomorrowOverrideInput = z.input<typeof inputSchema>;

export async function saveTomorrowOverride(
  input: TomorrowOverrideInput,
  dependencies: Readonly<{
    repository: ScheduleRepository;
    routeId: string;
    createId: () => string;
  }>,
): Promise<DateScheduleOverride> {
  const result = inputSchema.safeParse(input);
  if (!result.success) {
    throw new ValidationError("明日の予定の入力内容を確認してください。");
  }
  const existing = await dependencies.repository.getOverride(
    result.data.targetDate,
  );
  const id = existing?.id ?? dependencies.createId();
  const override: DateScheduleOverride =
    result.data.overrideType === "cancel"
      ? { id, targetDate: result.data.targetDate, overrideType: "cancel" }
      : {
          id,
          targetDate: result.data.targetDate,
          overrideType: "replace",
          title: result.data.title,
          startTime: result.data.startTime,
          locationLabel: result.data.locationLabel || undefined,
          routeId: dependencies.routeId,
        };
  await dependencies.repository.saveDateOverride(override);
  return override;
}

export async function restoreWeekdaySchedule(
  targetDate: string,
  repository: ScheduleRepository,
): Promise<void> {
  if (!z.iso.date().safeParse(targetDate).success) {
    throw new ValidationError("対象日を確認してください。");
  }
  await repository.deleteDateOverride(targetDate);
}
