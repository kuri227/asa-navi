import type { ScheduleRepository } from "@/application/ports/repositories";
import type {
  DateScheduleOverride,
  WeekdaySchedule,
} from "@/application/schedule";
import { ValidationError } from "@/application/errors/validation-error";

import {
  restoreWeekdaySchedule,
  saveTomorrowOverride,
} from "../save-tomorrow-override";

class FakeScheduleRepository implements ScheduleRepository {
  override: DateScheduleOverride | null = null;

  getWeekdaySchedule(): Promise<WeekdaySchedule | null> {
    return Promise.resolve(null);
  }
  getOverride(): Promise<DateScheduleOverride | null> {
    return Promise.resolve(this.override);
  }
  replaceWeekdaySchedules(): Promise<void> {
    return Promise.resolve();
  }
  replaceDateOverrides(): Promise<void> {
    return Promise.resolve();
  }
  saveDateOverride(override: DateScheduleOverride): Promise<void> {
    this.override = override;
    return Promise.resolve();
  }
  deleteDateOverride(): Promise<void> {
    this.override = null;
    return Promise.resolve();
  }
}

describe("tomorrow override", () => {
  it("saves one date without replacing other overrides", async () => {
    const repository = new FakeScheduleRepository();
    await expect(
      saveTomorrowOverride(
        {
          targetDate: "2026-10-10",
          overrideType: "replace",
          title: "午後から授業",
          startTime: "13:00",
          locationLabel: "講義棟B",
        },
        { repository, routeId: "route-1", createId: () => "override-1" },
      ),
    ).resolves.toMatchObject({
      id: "override-1",
      routeId: "route-1",
      title: "午後から授業",
    });
  });

  it("keeps the existing id when tomorrow is updated", async () => {
    const repository = new FakeScheduleRepository();
    repository.override = {
      id: "existing",
      targetDate: "2026-10-10",
      overrideType: "cancel",
    };
    const result = await saveTomorrowOverride(
      { targetDate: "2026-10-10", overrideType: "cancel" },
      { repository, routeId: "route-1", createId: () => "new" },
    );
    expect(result.id).toBe("existing");
  });

  it("rejects an invalid replacement before persistence", async () => {
    const repository = new FakeScheduleRepository();
    await expect(
      saveTomorrowOverride(
        {
          targetDate: "2026-10-10",
          overrideType: "replace",
          title: "",
          startTime: "25:00",
        },
        { repository, routeId: "route-1", createId: () => "new" },
      ),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("restores the weekday schedule by deleting only the selected date", async () => {
    const repository = new FakeScheduleRepository();
    repository.override = {
      id: "existing",
      targetDate: "2026-10-10",
      overrideType: "cancel",
    };
    await restoreWeekdaySchedule("2026-10-10", repository);
    expect(repository.override).toBeNull();
  });
});
