import type { ScheduleRepository } from "@/application/ports/repositories";
import type {
  DateScheduleOverride,
  WeekdaySchedule,
} from "@/application/schedule";

import {
  saveWeekdaySchedules,
  type WeekdayScheduleSetupInput,
} from "../save-weekday-schedules";

class FakeScheduleRepository implements ScheduleRepository {
  saved: readonly WeekdaySchedule[] | undefined;

  getWeekdaySchedule(): Promise<WeekdaySchedule | null> {
    return Promise.resolve(null);
  }

  getOverride(): Promise<DateScheduleOverride | null> {
    return Promise.resolve(null);
  }

  replaceWeekdaySchedules(
    schedules: readonly WeekdaySchedule[],
  ): Promise<void> {
    this.saved = schedules;
    return Promise.resolve();
  }

  replaceDateOverrides(): Promise<void> {
    return Promise.resolve();
  }
}

function createWeek(): WeekdayScheduleSetupInput[] {
  return Array.from({ length: 7 }, (_, weekday) => ({
    weekday,
    hasSchedule: weekday >= 1 && weekday <= 5,
    title: "1限",
    startTime: "08:50",
    locationLabel: "A棟",
  }));
}

describe("saveWeekdaySchedules", () => {
  it("persists only days with schedules and attaches the selected route", async () => {
    const repository = new FakeScheduleRepository();
    let nextId = 0;

    const result = await saveWeekdaySchedules(createWeek(), {
      repository,
      routeId: "route-1",
      createId: () => `schedule-${(nextId += 1)}`,
    });

    expect(result).toHaveLength(5);
    expect(result[0]).toEqual({
      id: "schedule-1",
      weekday: 1,
      title: "1限",
      startTime: "08:50",
      locationLabel: "A棟",
      routeId: "route-1",
      isActive: true,
    });
    expect(repository.saved).toEqual(result);
  });

  it("rejects duplicate weekdays", async () => {
    const repository = new FakeScheduleRepository();
    const week = createWeek();
    week[6] = { ...week[6], weekday: 1 };

    await expect(
      saveWeekdaySchedules(week, {
        repository,
        routeId: "route-1",
        createId: () => "id",
      }),
    ).rejects.toThrow("曜日予定の入力内容を確認してください。");
    expect(repository.saved).toBeUndefined();
  });

  it("rejects an invalid time on an enabled day", async () => {
    const repository = new FakeScheduleRepository();
    const week = createWeek();
    week[1] = { ...week[1], startTime: "25:00" };

    await expect(
      saveWeekdaySchedules(week, {
        repository,
        routeId: "route-1",
        createId: () => "id",
      }),
    ).rejects.toThrow("曜日予定の入力内容を確認してください。");
  });
});
