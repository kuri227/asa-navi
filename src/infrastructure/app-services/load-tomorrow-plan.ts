import { TZDate } from "@date-fns/tz";

import {
  loadTomorrowPlan,
  type TomorrowPlanPreview,
} from "@/application/tomorrow-plan";
import { openAppDatabase } from "@/infrastructure/db/open-database";
import { createMutationDatabase } from "@/infrastructure/db/query-database";
import {
  SQLiteRouteRepository,
  SQLiteRoutineRepository,
  SQLiteScheduleRepository,
  SQLiteSettingsRepository,
} from "@/infrastructure/db/repositories";

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

export function getTomorrowTargetDate(now: Date, timeZone: string): string {
  const tomorrow = new TZDate(now, timeZone);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const year = tomorrow.getFullYear();
  const month = String(tomorrow.getMonth() + 1).padStart(2, "0");
  const day = String(tomorrow.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
