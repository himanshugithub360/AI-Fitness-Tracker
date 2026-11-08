export const SEXES = ["male", "female", "other"] as const;
export const ACTIVITY_LEVELS = ["sedentary", "light", "moderate", "active", "very_active"] as const;
export const GOAL_TYPES = ["lose_fat", "maintain", "build_muscle"] as const;

export type Sex = (typeof SEXES)[number];
export type ActivityLevel = (typeof ACTIVITY_LEVELS)[number];
export type GoalType = (typeof GOAL_TYPES)[number];

/** How much a typical day of movement multiplies your resting energy use. */
export const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

/** Daily calories added to or taken from maintenance for each goal. */
export const GOAL_ADJUSTMENT: Record<GoalType, number> = {
  lose_fat: -500,
  maintain: 0,
  build_muscle: 300,
};

/** Protein per kilogram of body weight for each goal. */
export const PROTEIN_G_PER_KG: Record<GoalType, number> = {
  lose_fat: 2.0,
  maintain: 1.6,
  build_muscle: 1.8,
};

/** Share of calories that come from fat. Carbs fill whatever is left. */
const FAT_SHARE = 0.25;

/** Hard limits for a daily calorie target. Below this is not safe to suggest without a doctor. */
export const MIN_CALORIES = 1200;
export const MAX_CALORIES = 6000;

export const MIN_AGE = 16;
export const MAX_AGE = 100;

export type TargetInput = {
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
  activity: ActivityLevel;
  goal: GoalType;
};

export type Macros = {
  proteinG: number;
  carbsG: number;
  fatG: number;
};

export type Targets = Macros & {
  /** Calories your body burns at rest. */
  bmr: number;
  /** Calories to eat to stay the same weight. */
  maintenance: number;
  /** The suggested daily target for the chosen goal. */
  calories: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/** Whole years between a birth date (YYYY-MM-DD) and a day. */
export function ageOn(birthDate: string, now: Date = new Date()): number {
  const [year, month, day] = birthDate.split("-").map(Number);
  let age = now.getFullYear() - year;
  const hadBirthday =
    now.getMonth() + 1 > month || (now.getMonth() + 1 === month && now.getDate() >= day);
  if (!hadBirthday) age -= 1;
  return age;
}

/** Resting energy use, from the Mifflin-St Jeor equation. */
export function basalMetabolicRate(
  input: Pick<TargetInput, "sex" | "age" | "heightCm" | "weightKg">,
) {
  const base = 10 * input.weightKg + 6.25 * input.heightCm - 5 * input.age;
  if (input.sex === "male") return base + 5;
  if (input.sex === "female") return base - 161;
  return base - 78; // midway between the two
}

/** Protein, fat and carbs in grams for a calorie target. */
export function macrosForCalories(calories: number, weightKg: number, goal: GoalType): Macros {
  const proteinG = Math.round(weightKg * PROTEIN_G_PER_KG[goal]);
  const fatG = Math.round((calories * FAT_SHARE) / 9);
  const carbsG = Math.max(0, Math.round((calories - proteinG * 4 - fatG * 9) / 4));
  return { proteinG, carbsG, fatG };
}

/** The suggested daily calories and macros. These are estimates, not medical advice. */
export function calculateTargets(input: TargetInput): Targets {
  const bmr = basalMetabolicRate(input);
  const maintenance = Math.round(bmr * ACTIVITY_FACTORS[input.activity]);
  const suggested = Math.round((maintenance + GOAL_ADJUSTMENT[input.goal]) / 10) * 10;
  const calories = clamp(suggested, MIN_CALORIES, MAX_CALORIES);
  return {
    bmr: Math.round(bmr),
    maintenance,
    calories,
    ...macrosForCalories(calories, input.weightKg, input.goal),
  };
}

/** Calories in a macro split. Handy for checking the maths adds up. */
export function caloriesFromMacros({ proteinG, carbsG, fatG }: Macros): number {
  return proteinG * 4 + carbsG * 4 + fatG * 9;
}

// Units ---------------------------------------------------------------------

export type Units = "metric" | "imperial";

const KG_PER_LB = 0.45359237;
const CM_PER_INCH = 2.54;

export const lbToKg = (lb: number) => lb * KG_PER_LB;
export const kgToLb = (kg: number) => kg / KG_PER_LB;

export function ftInToCm(feet: number, inches: number) {
  return (feet * 12 + inches) * CM_PER_INCH;
}

export function cmToFtIn(cm: number) {
  const totalInches = Math.round(cm / CM_PER_INCH);
  return { feet: Math.floor(totalInches / 12), inches: totalInches % 12 };
}
