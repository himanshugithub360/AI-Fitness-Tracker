/**
 * Day and timezone helpers. A "day" is a plain YYYY-MM-DD string in the user's own timezone,
 * so "today" and midnight mean what they mean to the person, not to the server.
 */

const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const pad = (value: number) => String(value).padStart(2, "0");

export function isValidDay(value: string): boolean {
  if (!DAY_PATTERN.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

export function isValidTimezone(timezone: string): boolean {
  try {
    new Intl.DateTimeFormat("en", { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

/** The timezone if it is real, otherwise UTC. */
export function safeTimezone(timezone: string | null | undefined): string {
  return timezone && isValidTimezone(timezone) ? timezone : "UTC";
}

/** The calendar fields of an instant, as seen in a timezone. */
function partsIn(instantMs: number, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(instantMs));

  const read = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  return {
    year: read("year"),
    month: read("month"),
    day: read("day"),
    hour: read("hour"),
    minute: read("minute"),
    second: read("second"),
  };
}

/** How far a timezone is ahead of UTC at an instant, in milliseconds. */
function offsetMs(instantMs: number, timezone: string): number {
  const whole = Math.floor(instantMs / 1000) * 1000;
  const p = partsIn(whole, timezone);
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - whole;
}

/** The day (YYYY-MM-DD) it is right now in a timezone. */
export function todayIn(timezone: string, now: Date = new Date()): string {
  const p = partsIn(now.getTime(), timezone);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

/** The hour (0 to 23) it is right now in a timezone. */
export function hourIn(timezone: string, now: Date = new Date()): number {
  return partsIn(now.getTime(), timezone).hour;
}

export function addDays(day: string, amount: number): string {
  const [year, month, date] = day.split("-").map(Number);
  const moved = new Date(Date.UTC(year, month - 1, date + amount));
  return `${moved.getUTCFullYear()}-${pad(moved.getUTCMonth() + 1)}-${pad(moved.getUTCDate())}`;
}

/** The exact moment a wall-clock time happens in a timezone. Handles daylight saving. */
export function zonedTimeToUtc(day: string, hour: number, minute: number, timezone: string): Date {
  const [year, month, date] = day.split("-").map(Number);
  const guess = Date.UTC(year, month - 1, date, hour, minute);
  const firstOffset = offsetMs(guess, timezone);
  const first = guess - firstOffset;
  const secondOffset = offsetMs(first, timezone);
  return new Date(firstOffset === secondOffset ? first : guess - secondOffset);
}

/** The instants a local day starts (inclusive) and ends (exclusive). */
export function dayRange(day: string, timezone: string): { start: Date; end: Date } {
  return {
    start: zonedTimeToUtc(day, 0, 0, timezone),
    end: zonedTimeToUtc(addDays(day, 1), 0, 0, timezone),
  };
}

/** "Today", "Yesterday", "Tomorrow", or a short date like "Sat, 8 Nov". */
export function dayLabel(day: string, today: string): string {
  if (day === today) return "Today";
  if (day === addDays(today, -1)) return "Yesterday";
  if (day === addDays(today, 1)) return "Tomorrow";
  const [year, month, date] = day.split("-").map(Number);
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, date)));
}
