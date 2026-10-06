import { TZDate } from "@date-fns/tz";

import { ValidationError } from "@/application/errors/validation-error";
import type {
  DateScheduleOverride,
  ResolvedDaySchedule,
  ScheduleResolverInput,
  WeekdaySchedule,
} from "./types";

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_PATTERN = /^(\d{2}):(\d{2})$/;

const createZonedDate = (
  year: number,
  monthIndex: number,
  day: number,
  hour: number,
  minute: number,
  timeZone: string,
): TZDate => {
  try {
    const zonedDate = new TZDate(
      year,
      monthIndex,
      day,
      hour,
      minute,
      0,
      0,
      timeZone,
    );
    if (Number.isNaN(zonedDate.getTime())) {
      throw new RangeError("Invalid time zone");
    }
    return zonedDate;
  } catch {
    throw new ValidationError("timeZone must be a supported IANA time zone.");
  }
};

const parseDateParts = (
  targetDate: string,
): readonly [number, number, number] => {
  const match = DATE_PATTERN.exec(targetDate);
  if (match === null) {
    throw new ValidationError("targetDate must use YYYY-MM-DD format.");
  }

  const parts = [Number(match[1]), Number(match[2]), Number(match[3])] as const;
  const [year, month, day] = parts;
  const utcCheck = new Date(Date.UTC(year, month - 1, day));
  if (
    utcCheck.getUTCFullYear() !== year ||
    utcCheck.getUTCMonth() !== month - 1 ||
    utcCheck.getUTCDate() !== day
  ) {
    throw new ValidationError("targetDate must be a real calendar date.");
  }

  return parts;
};

const parseTimeParts = (time: string): readonly [number, number] => {
  const match = TIME_PATTERN.exec(time);
  if (match === null) {
    throw new ValidationError("startTime must use HH:mm format.");
  }

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) {
    throw new ValidationError("startTime must be a valid wall-clock time.");
  }

  return [hour, minute];
};

const resolveStartAt = (
  targetDate: string,
  startTime: string,
  timeZone: string,
): Date => {
  const [year, month, day] = parseDateParts(targetDate);
  const [hour, minute] = parseTimeParts(startTime);
  const zonedDate = createZonedDate(
    year,
    month - 1,
    day,
    hour,
    minute,
    timeZone,
  );

  if (
    zonedDate.getFullYear() !== year ||
    zonedDate.getMonth() !== month - 1 ||
    zonedDate.getDate() !== day ||
    zonedDate.getHours() !== hour ||
    zonedDate.getMinutes() !== minute
  ) {
    throw new ValidationError(
      "The local start time does not exist in the selected time zone.",
    );
  }

  return new Date(zonedDate.getTime());
};

const toResolvedSchedule = (
  source: "weekday" | "override",
  schedule:
    | WeekdaySchedule
    | Extract<DateScheduleOverride, { overrideType: "replace" }>,
  targetDate: string,
  timeZone: string,
): ResolvedDaySchedule => ({
  source,
  firstEvent: {
    id: schedule.id,
    title: schedule.title,
    startAt: resolveStartAt(targetDate, schedule.startTime, timeZone),
    ...(schedule.locationLabel === undefined
      ? {}
      : { locationLabel: schedule.locationLabel }),
  },
  ...(schedule.routeId === undefined ? {} : { routeId: schedule.routeId }),
});

export const resolveDaySchedule = (
  input: ScheduleResolverInput,
): ResolvedDaySchedule | null => {
  const [year, month, day] = parseDateParts(input.targetDate);
  const midnight = createZonedDate(year, month - 1, day, 0, 0, input.timeZone);

  const override = input.dateOverrides.find(
    (candidate) => candidate.targetDate === input.targetDate,
  );
  if (override?.overrideType === "cancel") {
    return null;
  }
  if (override?.overrideType === "replace") {
    return toResolvedSchedule(
      "override",
      override,
      input.targetDate,
      input.timeZone,
    );
  }

  const matchingSchedules = input.weekdaySchedules.filter(
    (schedule) => schedule.isActive && schedule.weekday === midnight.getDay(),
  );
  const resolvedSchedules = matchingSchedules.map((schedule) =>
    toResolvedSchedule("weekday", schedule, input.targetDate, input.timeZone),
  );

  return (
    resolvedSchedules.sort(
      (left, right) =>
        left.firstEvent.startAt.getTime() -
          right.firstEvent.startAt.getTime() ||
        left.firstEvent.id.localeCompare(right.firstEvent.id),
    )[0] ?? null
  );
};
