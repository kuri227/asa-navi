import {
  completeMorningTask,
  skipOptionalMorningTask,
  startMorningSession,
  type ActiveMorningSession,
  type MorningSessionDependencies,
} from "@/application/morning-session";
import { openAppDatabase } from "@/infrastructure/db/open-database";
import { runMutationTransaction } from "@/infrastructure/db/query-database";
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
    return await runMutationTransaction(database, (transaction) =>
      operation({
        sessionRepository: new SQLiteMorningSessionRepository(transaction),
        executionRepository: new SQLiteMorningTaskExecutionRepository(
          transaction,
        ),
        routeRepository: new SQLiteRouteRepository(transaction),
        routineRepository: new SQLiteRoutineRepository(transaction),
        settingsRepository: new SQLiteSettingsRepository(transaction),
        createId: createLocalId,
      }),
    );
  } finally {
    await database.closeAsync();
  }
}
