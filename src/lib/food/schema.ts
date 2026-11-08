import { z } from "zod";
import { isValidDay } from "@/lib/dates/tz";
import { MEAL_TYPES } from "./meals";

/** A macro box left empty means zero grams. */
const grams = (label: string) =>
  z.preprocess(
    (value) => (value === "" || value === null || value === undefined ? 0 : Number(value)),
    z
      .number(`${label} must be a number.`)
      .min(0, `${label} cannot be negative.`)
      .max(1000, `${label} looks too high.`),
  );

export const foodEntrySchema = z.object({
  day: z.string().refine(isValidDay, "Pick a real day."),
  meal: z.enum(MEAL_TYPES, "Choose a meal."),
  name: z.string().trim().min(1, "Enter what you ate.").max(200, "Use 200 characters or fewer."),
  // An empty box is "not entered", not zero, so it fails with the message below.
  calories: z.preprocess(
    (value) => (value === "" || value === null || value === undefined ? undefined : Number(value)),
    z
      .number("Enter the calories.")
      .min(0, "Calories cannot be negative.")
      .max(10000, "That is more than 10,000 calories."),
  ),
  protein: grams("Protein"),
  carbs: grams("Carbs"),
  fat: grams("Fat"),
});

export const foodUpdateSchema = foodEntrySchema.extend({
  id: z.uuid("Unknown entry."),
});

export const foodDeleteSchema = z.object({ id: z.uuid("Unknown entry.") });

export type FoodEntryInput = z.infer<typeof foodEntrySchema>;
