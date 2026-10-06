import type { CommuteRouteInput } from "@/application/route-setup";
import { saveCommuteRoute } from "@/application/route-setup";
import { openAppDatabase } from "@/infrastructure/db/open-database";
import { createMutationDatabase } from "@/infrastructure/db/query-database";
import { SQLiteRouteRepository } from "@/infrastructure/db/repositories";

let idSequence = 0;

function createLocalId(): string {
  idSequence += 1;
  return `${Date.now().toString(36)}-${idSequence.toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function saveCommuteRouteToDatabase(
  input: CommuteRouteInput,
): Promise<void> {
  const database = await openAppDatabase();
  try {
    await saveCommuteRoute(input, {
      repository: new SQLiteRouteRepository(createMutationDatabase(database)),
      createId: createLocalId,
      now: () => new Date(),
    });
  } finally {
    await database.closeAsync();
  }
}
