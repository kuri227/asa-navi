import {
  completeMorningTask,
  skipOptionalMorningTask,
  startMorningSession,
  type ActiveMorningSession,
  type MorningSessionDependencies,
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
  return withMorningSessionDependencies((dependencies) =>
    startMorningSession({ sessionId, now: new Date() }, dependencies),
  );
}

export async function completeMorningTaskInDatabase(
  sessionId: string,
  executionId: string,
): Promise<ActiveMorningSession> {
  return withMorningSessionDependencies((dependencies) =>
    completeMorningTask(
      { sessionId, executionId, now: new Date() },
      dependencies,
    ),
  );
}

export async function skipOptionalMorningTaskInDatabase(
  sessionId: string,
  executionId: string,
): Promise<ActiveMorningSession> {
  return withMorningSessionDependencies((dependencies) =>
    skipOptionalMorningTask(
      { sessionId, executionId, now: new Date() },
      dependencies,
    ),
  );
}

async function withMorningSessionDependencies<T>(
  operation: (dependencies: MorningSessionDependencies) => Promise<T>,
): Promise<T> {
  const database = await openAppDatabase();
  try {
    const mutationDatabase = createMutationDatabase(database);
    return await operation({
      sessionRepository: new SQLiteMorningSessionRepository(mutationDatabase),
      executionRepository: new SQLiteMorningTaskExecutionRepository(
        mutationDatabase,
      ),
      routeRepository: new SQLiteRouteRepository(mutationDatabase),
      routineRepository: new SQLiteRoutineRepository(mutationDatabase),
      settingsRepository: new SQLiteSettingsRepository(mutationDatabase),
      createId: createLocalId,
    });
  } finally {
    await database.closeAsync();
  }
}
