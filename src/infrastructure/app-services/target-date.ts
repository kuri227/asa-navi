import { TZDate } from "@date-fns/tz";

export function getTomorrowTargetDate(now: Date, timeZone: string): string {
  return getTargetDate(now, timeZone, 1);
}

export function getTargetDate(
  now: Date,
  timeZone: string,
  daysToAdd: number,
): string {
  const targetDate = new TZDate(now, timeZone);
  targetDate.setDate(targetDate.getDate() + daysToAdd);
  const year = targetDate.getFullYear();
  const month = String(targetDate.getMonth() + 1).padStart(2, "0");
  const day = String(targetDate.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
