import { describe, expect, it } from "vitest";
import {
  addDays,
  dayLabel,
  dayRange,
  hourIn,
  isValidDay,
  safeTimezone,
  todayIn,
  zonedTimeToUtc,
} from "./tz";

describe("isValidDay", () => {
  it("accepts real dates only", () => {
    expect(isValidDay("2026-11-08")).toBe(true);
    expect(isValidDay("2028-02-29")).toBe(true); // leap year
    expect(isValidDay("2026-02-29")).toBe(false);
    expect(isValidDay("2026-13-01")).toBe(false);
    expect(isValidDay("tomorrow")).toBe(false);
    expect(isValidDay("2026-1-5")).toBe(false);
  });
});

describe("safeTimezone", () => {
  it("falls back to UTC for anything unknown", () => {
    expect(safeTimezone("Asia/Kolkata")).toBe("Asia/Kolkata");
    expect(safeTimezone("Mars/Olympus")).toBe("UTC");
    expect(safeTimezone(null)).toBe("UTC");
    expect(safeTimezone("")).toBe("UTC");
  });
});

describe("todayIn and hourIn", () => {
  const instant = new Date("2026-11-08T20:00:00Z");

  it("reads the same instant differently in different timezones", () => {
    expect(todayIn("UTC", instant)).toBe("2026-11-08");
    expect(todayIn("Asia/Kolkata", instant)).toBe("2026-11-09"); // 01:30 the next morning
    expect(todayIn("America/Los_Angeles", instant)).toBe("2026-11-08");
    expect(hourIn("Asia/Kolkata", instant)).toBe(1);
    expect(hourIn("UTC", instant)).toBe(20);
  });
});

describe("addDays", () => {
  it("moves across month and year ends", () => {
    expect(addDays("2026-11-08", 1)).toBe("2026-11-09");
    expect(addDays("2026-11-30", 1)).toBe("2026-12-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });
});

describe("dayRange", () => {
  it("is a 24 hour span for a normal day", () => {
    const { start, end } = dayRange("2026-11-08", "UTC");
    expect(start.toISOString()).toBe("2026-11-08T00:00:00.000Z");
    expect(end.toISOString()).toBe("2026-11-09T00:00:00.000Z");
  });

  it("starts at local midnight, including half-hour offsets", () => {
    const { start, end } = dayRange("2026-11-08", "Asia/Kolkata");
    expect(start.toISOString()).toBe("2026-11-07T18:30:00.000Z");
    expect(end.toISOString()).toBe("2026-11-08T18:30:00.000Z");
  });

  it("is 25 hours on the day clocks go back", () => {
    const { start, end } = dayRange("2026-11-01", "America/New_York");
    expect((end.getTime() - start.getTime()) / 3_600_000).toBe(25);
  });

  it("is 23 hours on the day clocks go forward", () => {
    const { start, end } = dayRange("2026-03-08", "America/New_York");
    expect((end.getTime() - start.getTime()) / 3_600_000).toBe(23);
  });
});

describe("zonedTimeToUtc", () => {
  it("turns a local clock time into the right instant", () => {
    expect(zonedTimeToUtc("2026-11-08", 13, 0, "Asia/Kolkata").toISOString()).toBe(
      "2026-11-08T07:30:00.000Z",
    );
    expect(zonedTimeToUtc("2026-07-04", 12, 0, "America/New_York").toISOString()).toBe(
      "2026-07-04T16:00:00.000Z", // daylight saving, UTC-4
    );
  });
});

describe("dayLabel", () => {
  it("uses friendly names near today", () => {
    expect(dayLabel("2026-11-08", "2026-11-08")).toBe("Today");
    expect(dayLabel("2026-11-07", "2026-11-08")).toBe("Yesterday");
    expect(dayLabel("2026-11-09", "2026-11-08")).toBe("Tomorrow");
  });

  it("shows a short date otherwise", () => {
    expect(dayLabel("2026-11-02", "2026-11-08")).toMatch(/Mon,? 2 Nov/);
  });
});
