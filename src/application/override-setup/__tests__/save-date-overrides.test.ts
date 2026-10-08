import type { ScheduleRepository } from "@/application/ports/repositories";
import type {
  DateScheduleOverride,
  WeekdaySchedule,
} from "@/application/schedule";

import { saveDateOverrides } from "../save-date-overrides";

class FakeScheduleRepository implements ScheduleRepository {
  saved: readonly DateScheduleOverride[] | undefined;
  getWeekdaySchedule(): Promise<WeekdaySchedule | null> {
    return Promise.resolve(null);
  }
  getOverride(): Promise<DateScheduleOverride | null> {
    return Promise.resolve(null);
  }
  replaceWeekdaySchedules(): Promise<void> {
    return Promise.resolve();
  }
  replaceDateOverrides(items: readonly DateScheduleOverride[]): Promise<void> {
    this.saved = items;
    return Promise.resolve();
  }
  saveDateOverride(): Promise<void> {
    return Promise.resolve();
  }
  deleteDateOverride(): Promise<void> {
    return Promise.resolve();
  }
}

describe("saveDateOverrides", () => {
  it("maps cancel and replace overrides", async () => {
    const repository = new FakeScheduleRepository();
    let id = 0;
    const result = await saveDateOverrides(
      [
        { targetDate: "2026-10-13", overrideType: "cancel" },
        {
          targetDate: "2026-10-20",
          overrideType: "replace",
          title: "2限",
          startTime: "10:40",
          locationLabel: "B棟",
        },
      ],
      {
        repository,
        routeId: "route-1",
        createId: () => `override-${(id += 1)}`,
      },
    );
    expect(result).toEqual([
      { id: "override-1", targetDate: "2026-10-13", overrideType: "cancel" },
      {
        id: "override-2",
        targetDate: "2026-10-20",
        overrideType: "replace",
        title: "2限",
        startTime: "10:40",
        locationLabel: "B棟",
        routeId: "route-1",
      },
    ]);
    expect(repository.saved).toEqual(result);
  });

  it("rejects duplicate dates", async () => {
    const repository = new FakeScheduleRepository();
    await expect(
      saveDateOverrides(
        [
          { targetDate: "2026-10-13", overrideType: "cancel" },
          { targetDate: "2026-10-13", overrideType: "cancel" },
        ],
        { repository, routeId: "route-1", createId: () => "id" },
      ),
    ).rejects.toThrow("例外日の入力内容を確認してください。");
  });
});
