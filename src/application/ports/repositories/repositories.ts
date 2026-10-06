import type {
  DateScheduleOverride,
  WeekdaySchedule,
} from "@/application/schedule";
import type { MorningTaskTemplate, PlanningResult } from "@/domain/planning";

import type {
  AlarmRecord,
  AppSettings,
  CommuteRoute,
  MorningSession,
  MorningTaskExecution,
  PersistedMorningTaskTemplate,
  Place,
  RouteWithSegments,
} from "./models";

export interface ScheduleRepository {
  getWeekdaySchedule(weekday: number): Promise<WeekdaySchedule | null>;
  getOverride(targetDate: string): Promise<DateScheduleOverride | null>;
}

export interface RoutineRepository {
  listEnabledTasks(): Promise<MorningTaskTemplate[]>;
  listTaskTemplates(): Promise<PersistedMorningTaskTemplate[]>;
}

export interface RouteRepository {
  getDefaultRoute(): Promise<CommuteRoute | null>;
  getRouteWithSegments(routeId: string): Promise<RouteWithSegments | null>;
}

export interface MorningSessionRepository {
  create(session: MorningSession): Promise<void>;
  findActive(targetDate: string): Promise<MorningSession | null>;
  savePlan(sessionId: string, result: PlanningResult): Promise<void>;
  updateStatus(
    sessionId: string,
    status: MorningSession["status"],
  ): Promise<void>;
}

export interface MorningTaskExecutionRepository {
  replaceForSession(
    sessionId: string,
    executions: readonly MorningTaskExecution[],
  ): Promise<void>;
  listForSession(sessionId: string): Promise<readonly MorningTaskExecution[]>;
  save(execution: MorningTaskExecution): Promise<void>;
}

export interface AlarmRecordRepository {
  create(record: AlarmRecord): Promise<void>;
  listBySessionId(sessionId: string): Promise<AlarmRecord[]>;
  save(record: AlarmRecord): Promise<void>;
}

export interface SettingsRepository {
  get(): Promise<AppSettings>;
  save(settings: AppSettings): Promise<void>;
}

export interface PlaceRepository {
  findById(placeId: string): Promise<Place | null>;
  save(place: Place): Promise<void>;
}
