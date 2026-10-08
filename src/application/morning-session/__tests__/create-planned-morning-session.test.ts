import type {
  MorningSession,
  MorningSessionRepository,
} from "@/application/ports/repositories";
import type { TomorrowPlanPreview } from "@/application/tomorrow-plan";

import { createPlannedMorningSession } from "../create-planned-morning-session";

const now = new Date("2026-10-09T12:00:00.000Z");
const preview: Extract<TomorrowPlanPreview, { kind: "planned" }> = {
  kind: "planned",
  targetDate: "2026-10-10",
  timeZone: "Asia/Tokyo",
  source: "weekday",
  firstEvent: {
    id: "event-1",
    title: "1限",
    startAt: new Date("2026-10-09T23:50:00.000Z"),
  },
  routeId: "route-1",
  routeName: "大学ルート",
  routeSegments: [],
  basePlan: {
    routeDurationMin: 30,
    normalMorningDurationMin: 45,
    latestDepartureAt: new Date("2026-10-09T23:10:00.000Z"),
    recommendedWakeAt: new Date("2026-10-09T22:25:00.000Z"),
  },
  alarmState: "notScheduled",
};

describe("createPlannedMorningSession", () => {
  it("persists a planned session from the resolved preview", async () => {
    const repository = createRepository();
    const result = await createPlannedMorningSession(preview, {
      repository,
      createId: () => "session-1",
      now,
    });
    expect(result).toMatchObject({
      id: "session-1",
      targetDate: "2026-10-10",
      routeId: "route-1",
      status: "planned",
    });
    expect(repository.create).toHaveBeenCalledWith(result);
  });

  it("reuses an active session for the date instead of creating a duplicate", async () => {
    const repository = createRepository();
    const existing = createSession({ status: "active" });
    jest.mocked(repository.findActive).mockResolvedValue(existing);
    await expect(
      createPlannedMorningSession(preview, {
        repository,
        createId: () => "duplicate",
        now,
      }),
    ).resolves.toBe(existing);
    expect(repository.create).not.toHaveBeenCalled();
  });

  it("refreshes a planned session after tomorrow's schedule changes", async () => {
    const repository = createRepository();
    const existing = createSession({ firstEventTitle: "変更前" });
    jest.mocked(repository.findActive).mockResolvedValue(existing);
    const result = await createPlannedMorningSession(preview, {
      repository,
      createId: () => "duplicate",
      now,
    });
    expect(result.id).toBe(existing.id);
    expect(result.firstEventTitle).toBe("1限");
    expect(repository.savePrepared).toHaveBeenCalledWith(result);
    expect(repository.create).not.toHaveBeenCalled();
  });
});

function createRepository(): MorningSessionRepository {
  return {
    create: jest.fn(),
    savePrepared: jest.fn(),
    findById: jest.fn(),
    findActive: jest.fn().mockResolvedValue(null),
    start: jest.fn(),
    savePlan: jest.fn(),
    updateStatus: jest.fn(),
  };
}

function createSession(update: Partial<MorningSession> = {}): MorningSession {
  return {
    id: "session-existing",
    targetDate: "2026-10-10",
    firstEventTitle: "1限",
    firstEventStartAt: preview.firstEvent.startAt,
    routeId: "route-1",
    plannedWakeAt: preview.basePlan.recommendedWakeAt,
    latestDepartureAt: preview.basePlan.latestDepartureAt,
    status: "planned",
    lateByMin: 0,
    createdAt: now,
    updatedAt: now,
    ...update,
  };
}
