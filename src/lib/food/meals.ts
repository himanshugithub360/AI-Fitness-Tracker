import { hourIn, todayIn, zonedTimeToUtc } from "@/lib/dates/tz";

export const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"] as const;
export type MealType = (typeof MEAL_TYPES)[number];

export const MEAL_LABELS: Record<MealType, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snacks",
};

/** The clock hour used when a meal is logged on a day that is not today. */
export const MEAL_HOURS: Record<MealType, number> = {
  breakfast: 8,
  lunch: 13,
  snack: 16,
  dinner: 19,
};

/** The meal a food most likely belongs to at a given hour of the day. */
export function mealForHour(hour: number): MealType {
  if (hour < 4 || hour >= 22) return "snack";
  if (hour < 11) return "breakfast";
  if (hour < 15) return "lunch";
  if (hour < 18) return "snack";
  return "dinner";
}

export function currentMeal(timezone: string, now: Date = new Date()): MealType {
  return mealForHour(hourIn(timezone, now));
}

/**
 * When to record a food as eaten. On today it is right now. On any other day it is a
 * typical time for that meal, so the entry lands on the right day in the person's timezone.
 */
export function loggedAtFor(day: string, meal: MealType, timezone: string, now: Date = new Date()) {
  if (day === todayIn(timezone, now)) return now;
  return zonedTimeToUtc(day, MEAL_HOURS[meal], 0, timezone);
}
