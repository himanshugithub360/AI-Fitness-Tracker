export type FoodEntry = {
  id: string;
  name: string;
  meal_type: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  logged_at: string;
};

export type Totals = {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
};

const round1 = (value: number) => Math.round(value * 10) / 10;

export function sumEntries(
  entries: Pick<FoodEntry, "calories" | "protein_g" | "carbs_g" | "fat_g">[],
): Totals {
  const total = entries.reduce(
    (sum, entry) => ({
      calories: sum.calories + entry.calories,
      proteinG: sum.proteinG + entry.protein_g,
      carbsG: sum.carbsG + entry.carbs_g,
      fatG: sum.fatG + entry.fat_g,
    }),
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 },
  );
  return {
    calories: Math.round(total.calories),
    proteinG: round1(total.proteinG),
    carbsG: round1(total.carbsG),
    fatG: round1(total.fatG),
  };
}

/** Rows come back from the database with numeric columns that may be strings. */
export function toFoodEntry(row: Record<string, unknown>): FoodEntry {
  return {
    id: String(row.id),
    name: String(row.name),
    meal_type: String(row.meal_type),
    calories: Number(row.calories) || 0,
    protein_g: Number(row.protein_g) || 0,
    carbs_g: Number(row.carbs_g) || 0,
    fat_g: Number(row.fat_g) || 0,
    logged_at: String(row.logged_at),
  };
}
