import {
  calculateLatestDepartureAt,
  calculateRouteDuration,
  PlanningDomainError,
} from "@/domain/planning";
import type { RouteSegment } from "@/domain/planning";

const routeSegment = (
  id: string,
  durationMin: number,
  sortOrder: number,
): RouteSegment => ({
  id,
  mode: "walk",
  fromLabel: `${id}-from`,
  toLabel: `${id}-to`,
  durationMin,
  sortOrder,
});

describe("calculateRouteDuration", () => {
  it("sums multiple route segments for TC-P10", () => {
    const segments = [
      routeSegment("walk-to-station", 8, 1),
      { ...routeSegment("train", 12, 2), mode: "train" as const },
      { ...routeSegment("bus", 6, 3), mode: "bus" as const },
      routeSegment("walk-to-school", 5, 4),
    ];

    expect(calculateRouteDuration(segments)).toBe(31);
  });

  it("returns zero for an empty route and zero-duration segment", () => {
    expect(calculateRouteDuration([])).toBe(0);
    expect(calculateRouteDuration([routeSegment("wait", 0, 1)])).toBe(0);
  });

  it("rejects an invalid segment duration", () => {
    expect(() =>
      calculateRouteDuration([routeSegment("invalid", -1, 1)]),
    ).toThrow(
      expect.objectContaining<Partial<PlanningDomainError>>({
        code: "INVALID_DURATION",
      }),
    );
  });
});

describe("calculateLatestDepartureAt", () => {
  it("subtracts the arrival buffer and route duration", () => {
    const eventStartAt = new Date("2026-10-06T09:00:00+09:00");

    expect(calculateLatestDepartureAt(eventStartAt, 10, 45)).toEqual(
      new Date("2026-10-06T08:05:00+09:00"),
    );
  });

  it("supports a departure on the previous date", () => {
    const eventStartAt = new Date("2026-10-07T00:30:00+09:00");

    expect(calculateLatestDepartureAt(eventStartAt, 10, 40)).toEqual(
      new Date("2026-10-06T23:40:00+09:00"),
    );
  });

  it("does not mutate the event start date", () => {
    const eventStartAt = new Date("2026-10-06T09:00:00+09:00");
    const originalTime = eventStartAt.getTime();

    calculateLatestDepartureAt(eventStartAt, 10, 45);

    expect(eventStartAt.getTime()).toBe(originalTime);
  });

  it("rejects a result outside the supported Date range", () => {
    expect(() =>
      calculateLatestDepartureAt(
        new Date("2026-10-06T09:00:00+09:00"),
        0,
        1_000_000_000_000,
      ),
    ).toThrow(
      expect.objectContaining<Partial<PlanningDomainError>>({
        code: "INVALID_DATE",
      }),
    );
  });
});
