import type { FirstEvent } from "@/domain/planning";

export type WeekdaySchedule = Readonly<{
  id: string;
  weekday: number;
  title: string;
  startTime: string;
  locationLabel?: string;
  routeId?: string;
  isActive: boolean;
}>;

export type DateScheduleOverride =
  | Readonly<{
      id: string;
      targetDate: string;
      overrideType: "cancel";
    }>
  | Readonly<{
      id: string;
      targetDate: string;
      overrideType: "replace";
      title: string;
      startTime: string;
      locationLabel?: string;
      routeId?: string;
    }>;

export type ScheduleResolverInput = Readonly<{
  targetDate: string;
  timeZone: string;
  weekdaySchedules: readonly WeekdaySchedule[];
  dateOverrides: readonly DateScheduleOverride[];
}>;

export type ResolvedDaySchedule = Readonly<{
  source: "weekday" | "override";
  firstEvent: FirstEvent;
  routeId?: string;
}>;
