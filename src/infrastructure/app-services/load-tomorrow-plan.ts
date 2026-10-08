import { TZDate } from "@date-fns/tz";

import {
  loadTomorrowPlan,
  type TomorrowPlanPreview,
} from "@/application/tomorrow-plan";
import type { HomeDashboardData } from "@/application/home";
import { createPlannedMorningSession } from "@/application/morning-session";
import { openAppDatabase } from "@/infrastructure/db/open-database";
import { createMutationDatabase } from "@/infrastructure/db/query-database";
import {
  SQLiteRouteRepository,
  SQLiteRoutineRepository,
  SQLiteScheduleRepository,
  SQLiteSettingsRepository,
  SQLiteMorningSessionRepository,
} from "@/infrastructure/db/repositories";

import { createLocalId } from "./create-local-id";

export async function loadTomorrowPlanFromDatabase(): Promise<TomorrowPlanPreview> {
  const now = new Date();
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const targetDate = getTomorrowTargetDate(now, timeZone);
  const database = await openAppDatabase();
  try {
    const mutationDatabase = createMutationDatabase(database);
    return await loadTomorrowPlan(
      { targetDate, timeZone, now },
      {
        scheduleRepository: new SQLiteScheduleRepository(mutationDatabase),
        routeRepository: new SQLiteRouteRepository(mutationDatabase),
        routineRepository: new SQLiteRoutineRepository(mutationDatabase),
        settingsRepository: new SQLiteSettingsRepository(mutationDatabase),
      },
    );
  } finally {
    await database.closeAsync();
  }
}

export async function loadHomeDashboardFromDatabase(): Promise<HomeDashboardData> {
  const now = new Date();
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const today = getTargetDate(now, timeZone, 0);
  const targetDate = getTargetDate(now, timeZone, 1);
  const database = await openAppDatabase();
  try {
    const mutationDatabase = createMutationDatabase(database);
    const sessionRepository = new SQLiteMorningSessionRepository(
      mutationDatabase,
    );
    const activeSession = await sessionRepository.findActive(today);
    if (activeSession)
      return { kind: "morningSession", timeZone, session: activeSession };

    const preview = await loadTomorrowPlan(
      { targetDate, timeZone, now },
      {
        scheduleRepository: new SQLiteScheduleRepository(mutationDatabase),
        routeRepository: new SQLiteRouteRepository(mutationDatabase),
        routineRepository: new SQLiteRoutineRepository(mutationDatabase),
        settingsRepository: new SQLiteSettingsRepository(mutationDatabase),
      },
    );
    if (preview.kind === "noSchedule") {
      const staleSession = await sessionRepository.findActive(targetDate);
      if (staleSession?.status === "planned") {
        await sessionRepository.updateStatus(staleSession.id, "cancelled");
      }
      return preview;
    }
    const session = await createPlannedMorningSession(preview, {
      repository: sessionRepository,
      createId: createLocalId,
      now,
    });
    return { ...preview, sessionId: session.id };
  } finally {
    await database.closeAsync();
  }
}

export function getTomorrowTargetDate(now: Date, timeZone: string): string {
  return getTargetDate(now, timeZone, 1);
}

function getTargetDate(now: Date, timeZone: string, daysToAdd: number): string {
  const tomorrow = new TZDate(now, timeZone);
  tomorrow.setDate(tomorrow.getDate() + daysToAdd);
  const year = tomorrow.getFullYear();
  const month = String(tomorrow.getMonth() + 1).padStart(2, "0");
  const day = String(tomorrow.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
