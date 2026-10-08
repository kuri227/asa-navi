import type { RouteSegmentMode } from "@/domain/planning";

const weekdayLabels = ["日", "月", "火", "水", "木", "金", "土"] as const;

export function formatPlanDate(targetDate: string, _timeZone: string): string {
  const [year, month, day] = targetDate.split("-").map(Number);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return `${month}月${day}日（${weekdayLabels[weekday]}）`;
}

export function formatPlanTime(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export function getRouteModeLabel(mode: RouteSegmentMode): string {
  const labels: Record<RouteSegmentMode, string> = {
    walk: "徒歩",
    train: "電車",
    bus: "バス",
    bicycle: "自転車",
    other: "その他",
  };
  return labels[mode];
}
