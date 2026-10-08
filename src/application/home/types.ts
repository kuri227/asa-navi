import type { MorningSession } from "@/application/ports/repositories";
import type { TomorrowPlanPreview } from "@/application/tomorrow-plan";

export type HomeDashboardData =
  | Readonly<{
      kind: "morningSession";
      timeZone: string;
      session: MorningSession;
    }>
  | Extract<TomorrowPlanPreview, { kind: "noSchedule" }>
  | Readonly<
      Extract<TomorrowPlanPreview, { kind: "planned" }> & {
        sessionId: string;
      }
    >;
