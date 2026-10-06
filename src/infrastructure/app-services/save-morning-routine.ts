import type { MorningRoutineTaskInput } from "@/application/routine-setup";
import { saveMorningRoutine } from "@/application/routine-setup";
import { openAppDatabase } from "@/infrastructure/db/open-database";
import { createMutationDatabase } from "@/infrastructure/db/query-database";
import { SQLiteRoutineRepository } from "@/infrastructure/db/repositories";

import { createLocalId } from "./create-local-id";

export async function saveMorningRoutineToDatabase(
  input: readonly MorningRoutineTaskInput[],
): Promise<void> {
  const database = await openAppDatabase();
  try {
    const mutationDatabase = createMutationDatabase(database);
    await saveMorningRoutine(input, {
      repository: new SQLiteRoutineRepository(mutationDatabase),
      createId: createLocalId,
      now: () => new Date(),
    });
  } finally {
    await database.closeAsync();
  }
}
