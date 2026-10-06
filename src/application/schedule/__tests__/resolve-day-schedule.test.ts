import { resolveDaySchedule } from "@/application/schedule";
import { ValidationError } from "@/application/errors/validation-error";
import type {
  ScheduleResolverInput,
  WeekdaySchedule,
} from "@/application/schedule";

const tuesdaySchedule = (startTime = "09:00"): WeekdaySchedule => ({
  id: `tuesday-${startTime}`,
  weekday: 2,
  title: "1限",
  startTime,
  routeId: "school-route",
  isActive: true,
});

const createInput = (): ScheduleResolverInput => ({
  targetDate: "2026-10-06",
  timeZone: "Asia/Tokyo",
  weekdaySchedules: [tuesdaySchedule()],
  dateOverrides: [],
});

describe("resolveDaySchedule", () => {
  it("resolves the earliest active weekday event to an absolute date", () => {
    const input: ScheduleResolverInput = {
      ...createInput(),
      weekdaySchedules: [tuesdaySchedule("10:40"), tuesdaySchedule("08:50")],
    };

    const result = resolveDaySchedule(input);

    expect(result?.source).toBe("weekday");
    expect(result?.firstEvent.startAt).toEqual(
      new Date("2026-10-06T08:50:00+09:00"),
    );
  });

  it("returns no plan for TC-P08 cancel override", () => {
    const result = resolveDaySchedule({
      ...createInput(),
      dateOverrides: [
        { id: "holiday", targetDate: "2026-10-06", overrideType: "cancel" },
      ],
    });

    expect(result).toBeNull();
  });

  it("uses TC-P09 replace override before weekday schedules", () => {
    const result = resolveDaySchedule({
      ...createInput(),
      dateOverrides: [
        {
          id: "second-period",
          targetDate: "2026-10-06",
          overrideType: "replace",
          title: "2限",
          startTime: "10:40",
        },
      ],
    });

    expect(result?.source).toBe("override");
    expect(result?.firstEvent.startAt).toEqual(
      new Date("2026-10-06T10:40:00+09:00"),
    );
  });

  it("uses the supplied time zone instead of the process time zone", () => {
    const result = resolveDaySchedule({
      targetDate: "2026-01-06",
      timeZone: "America/New_York",
      weekdaySchedules: [tuesdaySchedule("09:00")],
      dateOverrides: [],
    });

    expect(result?.firstEvent.startAt).toEqual(
      new Date("2026-01-06T14:00:00.000Z"),
    );
  });

  it("rejects a nonexistent local time during a DST gap", () => {
    expect(() =>
      resolveDaySchedule({
        targetDate: "2026-03-08",
        timeZone: "America/New_York",
        weekdaySchedules: [
          { ...tuesdaySchedule("02:30"), id: "dst-gap", weekday: 0 },
        ],
        dateOverrides: [],
      }),
    ).toThrow(ValidationError);
  });

  it("returns null when neither override nor weekday schedule exists", () => {
    expect(
      resolveDaySchedule({ ...createInput(), weekdaySchedules: [] }),
    ).toBeNull();
  });

  it("wraps an unsupported time zone as a ValidationError", () => {
    expect(() =>
      resolveDaySchedule({ ...createInput(), timeZone: "Invalid/Time_Zone" }),
    ).toThrow(ValidationError);
  });
});
