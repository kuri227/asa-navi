import { z } from "zod";

import { ValidationError } from "@/application/errors/validation-error";
import type {
  PersistedMorningTaskTemplate,
  RoutineRepository,
} from "@/application/ports/repositories";

const taskSchema = z
  .object({
    name: z.string().trim().min(1).max(80),
    normalDurationMin: z.number().int().min(1).max(1440),
    minimumDurationMin: z.number().int().min(0).max(1440),
    requirement: z.enum(["required", "optional"]),
    specialType: z
      .enum(["meal", "bath", "grooming", "clothing", "belongings", "other"])
      .optional(),
  })
  .refine((task) => task.minimumDurationMin <= task.normalDurationMin, {
    message: "最短時間は通常時間以下にしてください。",
  });

const inputSchema = z.array(taskSchema).min(1).max(30);
export type MorningRoutineTaskInput = z.input<typeof taskSchema>;

export async function saveMorningRoutine(
  input: readonly MorningRoutineTaskInput[],
  dependencies: Readonly<{
    repository: RoutineRepository;
    createId: () => string;
    now: () => Date;
  }>,
): Promise<readonly PersistedMorningTaskTemplate[]> {
  const result = inputSchema.safeParse(input);
  if (!result.success) {
    throw new ValidationError("朝ルーティンの入力内容を確認してください。");
  }
  const now = dependencies.now();
  const tasks = result.data.map<PersistedMorningTaskTemplate>(
    (task, index) => ({
      id: dependencies.createId(),
      name: task.name,
      normalDurationMin: task.normalDurationMin,
      minimumDurationMin: task.minimumDurationMin,
      requirement: task.requirement,
      compressionPriority: index,
      skipPriority: index,
      sortOrder: index,
      enabled: true,
      specialType: task.specialType,
      createdAt: now,
      updatedAt: now,
    }),
  );
  await dependencies.repository.replaceTaskTemplates(tasks);
  return tasks;
}
