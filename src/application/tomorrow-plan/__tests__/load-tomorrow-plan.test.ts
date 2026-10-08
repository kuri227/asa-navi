import type {
  RouteRepository,
  RoutineRepository,
  ScheduleRepository,
  SettingsRepository,
} from "@/application/ports/repositories";
import { ValidationError } from "@/application/errors/validation-error";

import { loadTomorrowPlan } from "../load-tomorrow-plan";

const now = new Date("2026-10-08T12:00:00.000Z");
const timestamp = new Date("2026-10-01T00:00:00.000Z");

function createDependencies() {
  const scheduleRepository: ScheduleRepository = {
    getOverride: jest.fn().mockResolvedValue(null),
    getWeekdaySchedule: jest.fn().mockResolvedValue({
      id: "schedule-friday",
      weekday: 5,
      title: "1限",
      startTime: "08:50",
      locationLabel: "講義棟",
      routeId: "route-1",
      isActive: true,
    }),
    replaceWeekdaySchedules: jest.fn(),
    replaceDateOverrides: jest.fn(),
  };
  const routeRepository: RouteRepository = {
    getDefaultRoute: jest.fn().mockResolvedValue(null),
    getRouteWithSegments: jest.fn().mockResolvedValue({
      route: {
        id: "route-1",
        name: "いつもの通学ルート",
        isDefault: true,
        isActive: true,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      segments: [
        {
          id: "segment-1",
          routeId: "route-1",
          sortOrder: 0,
          mode: "train",
          fromLabel: "自宅最寄り駅",
          toLabel: "大学最寄り駅",
          durationMin: 30,
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      ],
    }),
    saveRouteWithSegments: jest.fn(),
  };
  const routineRepository: RoutineRepository = {
    listEnabledTasks: jest.fn().mockResolvedValue([
      {
        id: "breakfast",
        name: "朝食",
        normalDurationMin: 20,
        minimumDurationMin: 10,
        requirement: "required",
        compressionPriority: 0,
        skipPriority: 0,
        sortOrder: 0,
        enabled: true,
      },
    ]),
    listTaskTemplates: jest.fn(),
    replaceTaskTemplates: jest.fn(),
  };
  const settingsRepository: SettingsRepository = {
    get: jest.fn().mockResolvedValue({
      arrivalBufferMin: 10,
      tightThresholdMin: 10,
      onboardingCompleted: true,
      createdAt: timestamp,
      updatedAt: timestamp,
    }),
    save: jest.fn(),
  };
  return {
    scheduleRepository,
    routeRepository,
    routineRepository,
    settingsRepository,
  };
}

describe("loadTomorrowPlan", () => {
  it("builds the next-day base plan from an override-aware schedule", async () => {
    const dependencies = createDependencies();
    const result = await loadTomorrowPlan(
      { targetDate: "2026-10-09", timeZone: "Asia/Tokyo", now },
      dependencies,
    );
    expect(
      dependencies.scheduleRepository.getWeekdaySchedule,
    ).toHaveBeenCalledWith(5);
    expect(result).toMatchObject({
      kind: "planned",
      targetDate: "2026-10-09",
      routeName: "いつもの通学ルート",
      basePlan: {
        routeDurationMin: 30,
        normalMorningDurationMin: 20,
      },
    });
    if (result.kind === "planned") {
      expect(result.basePlan.latestDepartureAt.toISOString()).toBe(
        "2026-10-08T23:10:00.000Z",
      );
      expect(result.basePlan.recommendedWakeAt.toISOString()).toBe(
        "2026-10-08T22:50:00.000Z",
      );
    }
  });

  it("returns no schedule when a date override cancels tomorrow", async () => {
    const dependencies = createDependencies();
    jest.mocked(dependencies.scheduleRepository.getOverride).mockResolvedValue({
      id: "override-1",
      targetDate: "2026-10-09",
      overrideType: "cancel",
    });
    await expect(
      loadTomorrowPlan(
        { targetDate: "2026-10-09", timeZone: "Asia/Tokyo", now },
        dependencies,
      ),
    ).resolves.toEqual({ kind: "noSchedule", targetDate: "2026-10-09" });
    expect(
      dependencies.routeRepository.getRouteWithSegments,
    ).not.toHaveBeenCalled();
  });

  it("uses the default route when the schedule has no route", async () => {
    const dependencies = createDependencies();
    const schedule =
      await dependencies.scheduleRepository.getWeekdaySchedule(5);
    jest
      .mocked(dependencies.scheduleRepository.getWeekdaySchedule)
      .mockResolvedValue(schedule ? { ...schedule, routeId: undefined } : null);
    jest
      .mocked(dependencies.routeRepository.getDefaultRoute)
      .mockResolvedValue({
        id: "route-1",
        name: "いつもの通学ルート",
        isDefault: true,
        isActive: true,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
    await loadTomorrowPlan(
      { targetDate: "2026-10-09", timeZone: "Asia/Tokyo", now },
      dependencies,
    );
    expect(dependencies.routeRepository.getDefaultRoute).toHaveBeenCalledTimes(
      1,
    );
  });

  it("reports a recoverable error when no route is available", async () => {
    const dependencies = createDependencies();
    const schedule =
      await dependencies.scheduleRepository.getWeekdaySchedule(5);
    jest
      .mocked(dependencies.scheduleRepository.getWeekdaySchedule)
      .mockResolvedValue(schedule ? { ...schedule, routeId: undefined } : null);
    await expect(
      loadTomorrowPlan(
        { targetDate: "2026-10-09", timeZone: "Asia/Tokyo", now },
        dependencies,
      ),
    ).rejects.toBeInstanceOf(ValidationError);
  });
});
