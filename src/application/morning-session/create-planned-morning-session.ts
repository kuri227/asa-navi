import type {
  MorningSession,
  MorningSessionRepository,
} from "@/application/ports/repositories";
import type { TomorrowPlanPreview } from "@/application/tomorrow-plan";

type PlannedPreview = Extract<TomorrowPlanPreview, { kind: "planned" }>;

export async function createPlannedMorningSession(
  preview: PlannedPreview,
  dependencies: Readonly<{
    repository: MorningSessionRepository;
    createId: () => string;
    now: Date;
  }>,
): Promise<MorningSession> {
  const existing = await dependencies.repository.findActive(preview.targetDate);
  if (existing?.status === "active") return existing;

  const session: MorningSession = {
    id: existing?.id ?? dependencies.createId(),
    targetDate: preview.targetDate,
    firstEventTitle: preview.firstEvent.title,
    firstEventStartAt: preview.firstEvent.startAt,
    routeId: preview.routeId,
    plannedWakeAt: preview.basePlan.recommendedWakeAt,
    latestDepartureAt: preview.basePlan.latestDepartureAt,
    status: "planned",
    lateByMin: 0,
    createdAt: existing?.createdAt ?? dependencies.now,
    updatedAt: dependencies.now,
  };
  if (existing) {
    await dependencies.repository.savePrepared(session);
  } else {
    await dependencies.repository.create(session);
  }
  return session;
}
