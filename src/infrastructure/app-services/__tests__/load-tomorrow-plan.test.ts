import { getTomorrowTargetDate } from "../target-date";

describe("getTomorrowTargetDate", () => {
  it("uses the device time zone across a UTC date boundary", () => {
    expect(
      getTomorrowTargetDate(new Date("2026-10-08T16:30:00.000Z"), "Asia/Tokyo"),
    ).toBe("2026-10-10");
  });

  it("handles a month boundary", () => {
    expect(
      getTomorrowTargetDate(new Date("2026-10-31T03:00:00.000Z"), "Asia/Tokyo"),
    ).toBe("2026-11-01");
  });
});
