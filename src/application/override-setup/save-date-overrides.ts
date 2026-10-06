import { z } from "zod";

import { ValidationError } from "@/application/errors/validation-error";
import type { ScheduleRepository } from "@/application/ports/repositories";
import type { DateScheduleOverride } from "@/application/schedule";

const overrideInputSchema = z.discriminatedUnion("overrideType", [
  z.object({
    overrideType: z.literal("cancel"),
    targetDate: z.iso.date(),
  }),
  z.object({
    overrideType: z.literal("replace"),
    targetDate: z.iso.date(),
    title: z.string().trim().min(1).max(80),
    startTime: z
      .string()
      .trim()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    locationLabel: z.string().trim().max(100).optional(),
  }),
]);

const inputSchema = z
  .array(overrideInputSchema)
  .max(100)
  .superRefine((items, context) => {
    if (
      new Set(items.map(({ targetDate }) => targetDate)).size !== items.length
    ) {
      context.addIssue({
        code: "custom",
        message: "同じ日付が重複しています。",
      });
    }
  });

export type DateOverrideSetupInput = z.input<typeof overrideInputSchema>;

export async function saveDateOverrides(
  input: readonly DateOverrideSetupInput[],
  dependencies: Readonly<{
    repository: ScheduleRepository;
    routeId: string;
    createId: () => string;
  }>,
): Promise<readonly DateScheduleOverride[]> {
  const result = inputSchema.safeParse(input);
  if (!result.success) {
    throw new ValidationError("例外日の入力内容を確認してください。");
  }
  const overrides = result.data.map<DateScheduleOverride>((item) =>
    item.overrideType === "cancel"
      ? {
          id: dependencies.createId(),
          targetDate: item.targetDate,
          overrideType: "cancel",
        }
      : {
          id: dependencies.createId(),
          targetDate: item.targetDate,
          overrideType: "replace",
          title: item.title,
          startTime: item.startTime,
          locationLabel: item.locationLabel || undefined,
          routeId: dependencies.routeId,
        },
  );
  await dependencies.repository.replaceDateOverrides(overrides);
  return overrides;
}
