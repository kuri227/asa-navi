import type { WeekdayScheduleSetupInput } from "@/application/schedule-setup";

export type WeekdayDraft = WeekdayScheduleSetupInput & {
  label: string;
};

const WEEKDAYS = [
  { weekday: 1, label: "月曜日" },
  { weekday: 2, label: "火曜日" },
  { weekday: 3, label: "水曜日" },
  { weekday: 4, label: "木曜日" },
  { weekday: 5, label: "金曜日" },
  { weekday: 6, label: "土曜日" },
  { weekday: 0, label: "日曜日" },
] as const;

export function createInitialWeek(): WeekdayDraft[] {
  return WEEKDAYS.map(({ weekday, label }) => ({
    weekday,
    label,
    hasSchedule: weekday >= 1 && weekday <= 5,
    title: "1限",
    startTime: "08:50",
    locationLabel: "",
  }));
}

export function isValidTime(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value.trim());
}

export function hasInvalidEnabledDay(days: readonly WeekdayDraft[]): boolean {
  return days.some(
    (day) =>
      day.hasSchedule && (!day.title.trim() || !isValidTime(day.startTime)),
  );
}
