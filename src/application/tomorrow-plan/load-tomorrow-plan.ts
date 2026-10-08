import { TZDate } from "@date-fns/tz";
import { z } from "zod";

import { ValidationError } from "@/application/errors/validation-error";
import type {
  RouteRepository,
  RoutineRepository,
  ScheduleRepository,
  SettingsRepository,
} from "@/application/ports/repositories";
import { resolveDaySchedule } from "@/application/schedule";
import {
  calculateBasePlan,
  type BasePlan,
  type FirstEvent,
  type RouteSegment,
} from "@/domain/planning";

const targetDateSchema = z.iso.date();

export type TomorrowPlanPreview =
  | Readonly<{
      kind: "noSchedule";
      targetDate: string;
      timeZone: string;
    }>
  | Readonly<{
      kind: "planned";
      targetDate: string;
      timeZone: string;
      source: "weekday" | "override";
      firstEvent: FirstEvent;
      routeId: string;
      routeName: string;
      routeSegments: readonly RouteSegment[];
      basePlan: BasePlan;
      alarmState: "notScheduled";
    }>;

type Dependencies = Readonly<{
  scheduleRepository: ScheduleRepository;
  routeRepository: RouteRepository;
  routineRepository: RoutineRepository;
  settingsRepository: SettingsRepository;
}>;

export async function loadTomorrowPlan(
  input: Readonly<{ targetDate: string; timeZone: string; now: Date }>,
  dependencies: Dependencies,
): Promise<TomorrowPlanPreview> {
  const weekday = getWeekday(input.targetDate, input.timeZone);
  const [override, weekdaySchedule] = await Promise.all([
    dependencies.scheduleRepository.getOverride(input.targetDate),
    dependencies.scheduleRepository.getWeekdaySchedule(weekday),
  ]);
  const resolved = resolveDaySchedule({
    targetDate: input.targetDate,
    timeZone: input.timeZone,
    weekdaySchedules: weekdaySchedule ? [weekdaySchedule] : [],
    dateOverrides: override ? [override] : [],
  });
  if (!resolved) {
    return {
      kind: "noSchedule",
      targetDate: input.targetDate,
      timeZone: input.timeZone,
    };
  }

  const defaultRoute = resolved.routeId
    ? null
    : await dependencies.routeRepository.getDefaultRoute();
  const routeId = resolved.routeId ?? defaultRoute?.id;
  if (!routeId) {
    throw new ValidationError("通学ルートが設定されていません。");
  }

  const [routeWithSegments, tasks, settings] = await Promise.all([
    dependencies.routeRepository.getRouteWithSegments(routeId),
    dependencies.routineRepository.listEnabledTasks(),
    dependencies.settingsRepository.get(),
  ]);
  if (!routeWithSegments) {
    throw new ValidationError("通学ルートを読み込めませんでした。");
  }

  const routeSegments: readonly RouteSegment[] = routeWithSegments.segments;
  const basePlan = calculateBasePlan({
    now: input.now,
    firstEvent: resolved.firstEvent,
    arrivalBufferMin: settings.arrivalBufferMin,
    routeSegments,
    tasks,
    completedTaskIds: [],
  });

  return {
    kind: "planned",
    targetDate: input.targetDate,
    timeZone: input.timeZone,
    source: resolved.source,
    firstEvent: resolved.firstEvent,
    routeId,
    routeName: routeWithSegments.route.name,
    routeSegments,
    basePlan,
    alarmState: "notScheduled",
  };
}

function getWeekday(targetDate: string, timeZone: string): number {
  const result = targetDateSchema.safeParse(targetDate);
  if (!result.success) {
    throw new ValidationError("対象日はYYYY-MM-DD形式で指定してください。");
  }
  const [year, month, day] = result.data.split("-").map(Number);
  try {
    const date = new TZDate(year, month - 1, day, 0, 0, 0, 0, timeZone);
    if (Number.isNaN(date.getTime())) throw new RangeError("Invalid date");
    return date.getDay();
  } catch {
    throw new ValidationError("端末のタイムゾーンを確認できませんでした。");
  }
}
