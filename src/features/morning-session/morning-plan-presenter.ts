import type { ActiveMorningSession } from "@/application/morning-session";
import type { PlanningAdjustment } from "@/domain/planning";

const MILLISECONDS_PER_MINUTE = 60_000;

export function getWakeTimingMessage(
  actualWakeAt: Date | undefined,
  plannedWakeAt: Date,
): string {
  if (!actualWakeAt) return "起床時刻を記録しました";
  const differenceMin = Math.round(
    (actualWakeAt.getTime() - plannedWakeAt.getTime()) /
      MILLISECONDS_PER_MINUTE,
  );
  if (differenceMin > 0) return `予定より${differenceMin}分遅い起床です`;
  if (differenceMin < 0)
    return `予定より${Math.abs(differenceMin)}分早い起床です`;
  return "予定どおりの起床です";
}

export function getPlanStatusMessage(
  plan: ActiveMorningSession["plan"],
): string {
  if (plan.lateByMin > 0) {
    return `このプランでは${plan.lateByMin}分遅れる見込みです`;
  }
  if (plan.slackMin > 0) {
    return `このプランなら${plan.slackMin}分の余裕があります`;
  }
  return "このプランで予定時刻に出発できます";
}

export function getAdjustmentText(
  adjustment: PlanningAdjustment,
  taskNames: ReadonlyMap<string, string>,
): string | null {
  if (adjustment.type === "late") return null;
  const name = taskNames.get(adjustment.taskId) ?? "朝タスク";
  if (adjustment.type === "compress") {
    return `${name}を${adjustment.fromMin}分から${adjustment.toMin}分に短縮`;
  }
  return `${name}を省略`;
}
