import { z } from "zod";
import {
  ACTIVITY_LEVELS,
  GOAL_TYPES,
  MAX_AGE,
  MAX_CALORIES,
  MIN_AGE,
  MIN_CALORIES,
  SEXES,
  ageOn,
} from "@/lib/nutrition/targets";

const birthDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter your date of birth.")
  .refine((value) => !Number.isNaN(Date.parse(value)), "Enter a real date.")
  .refine((value) => {
    const age = ageOn(value);
    return age >= MIN_AGE && age <= MAX_AGE;
  }, `APEX is for ages ${MIN_AGE} to ${MAX_AGE}.`);

/** Optional number: an empty box means "not given". */
const optionalNumber = (min: number, max: number, message: string) =>
  z.preprocess(
    (value) => (value === "" || value === null || value === undefined ? undefined : Number(value)),
    z.number(message).min(min, message).max(max, message).optional(),
  );

const timezone = z
  .string()
  .max(64)
  .refine((value) => {
    try {
      new Intl.DateTimeFormat("en", { timeZone: value });
      return true;
    } catch {
      return false;
    }
  }, "Unknown timezone.")
  .catch("UTC");

export const onboardingSchema = z.object({
  timezone,
  displayName: z.string().trim().min(1, "Enter your name.").max(80, "Use 80 characters or fewer."),
  sex: z.enum(SEXES, "Choose one."),
  birthDate,
  units: z.enum(["metric", "imperial"]),
  heightCm: z.coerce
    .number("Enter your height.")
    .min(100, "Height looks too low.")
    .max(250, "Height looks too high."),
  weightKg: z.coerce
    .number("Enter your weight.")
    .min(30, "Weight looks too low.")
    .max(300, "Weight looks too high."),
  activity: z.enum(ACTIVITY_LEVELS, "Choose one."),
  goal: z.enum(GOAL_TYPES, "Choose one."),
  targetWeightKg: optionalNumber(30, 300, "Target weight looks wrong."),
  calories: z.coerce
    .number("Pick a daily calorie target.")
    .int()
    .min(MIN_CALORIES, `Use at least ${MIN_CALORIES} calories.`)
    .max(MAX_CALORIES, `Use at most ${MAX_CALORIES} calories.`),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;
