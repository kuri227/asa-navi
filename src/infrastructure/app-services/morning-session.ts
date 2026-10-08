import {
  startMorningSession,
  type ActiveMorningSession,
} from "@/application/morning-session";
import { openAppDatabase } from "@/infrastructure/db/open-database";
import { createMutationDatabase } from "@/infrastructure/db/query-database";
import {
  SQLiteMorningSessionRepository,
  SQLiteMorningTaskExecutionRepository,
  SQLiteRouteRepository,
  SQLiteRoutineRepository,
  SQLiteSettingsRepository,
} from "@/infrastructure/db/repositories";

import { createLocalId } from "./create-local-id";

export async function startMorningSessionFromDatabase(
  sessionId: string,
): Promise<ActiveMorningSession> {
  const database = await openAppDatabase();
  try {
    const mutationDatabase = createMutationDatabase(database);
    return await startMorningSession(
      { sessionId, now: new Date() },
      {
        sessionRepository: new SQLiteMorningSessionRepository(mutationDatabase),
        executionRepository: new SQLiteMorningTaskExecutionRepository(
          mutationDatabase,
        ),
        routeRepository: new SQLiteRouteRepository(mutationDatabase),
        routineRepository: new SQLiteRoutineRepository(mutationDatabase),
        settingsRepository: new SQLiteSettingsRepository(mutationDatabase),
        createId: createLocalId,
      },
    );
  } finally {
    await database.closeAsync();
  }
}
