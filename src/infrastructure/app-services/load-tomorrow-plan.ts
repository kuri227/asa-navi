import {
  loadTomorrowPlan,
  type TomorrowPlanPreview,
} from "@/application/tomorrow-plan";
import type { HomeDashboardData } from "@/application/home";
import { syncMorningAlarm } from "@/application/alarms";
import { createPlannedMorningSession } from "@/application/morning-session";
import { openAppDatabase } from "@/infrastructure/db/open-database";
import { createMutationDatabase } from "@/infrastructure/db/query-database";
import {
  SQLiteRouteRepository,
  SQLiteRoutineRepository,
  SQLiteScheduleRepository,
  SQLiteSettingsRepository,
  SQLiteMorningSessionRepository,
  SQLiteAlarmRecordRepository,
} from "@/infrastructure/db/repositories";
import { ExpoNotificationAlarmService } from "@/infrastructure/notifications/expo-notification-alarm-service";

import { createLocalId } from "./create-local-id";
import { getTargetDate, getTomorrowTargetDate } from "./target-date";

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
    const alarmRecordRepository = new SQLiteAlarmRecordRepository(
      mutationDatabase,
    );
    const alarmService = new ExpoNotificationAlarmService();
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
        await syncMorningAlarm(
          {
            session: { ...staleSession, status: "cancelled", updatedAt: now },
            now,
          },
          { alarmService, alarmRecordRepository, createId: createLocalId },
        );
      }
      return preview;
    }
    const session = await createPlannedMorningSession(preview, {
      repository: sessionRepository,
      createId: createLocalId,
      now,
    });
    const alarm = await syncMorningAlarm(
      { session, now },
      { alarmService, alarmRecordRepository, createId: createLocalId },
    );
    return { ...preview, sessionId: session.id, alarmState: alarm.state };
  } finally {
    await database.closeAsync();
  }
}
