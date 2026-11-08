import { describe, expect, it } from "vitest";
import { currentMeal, loggedAtFor, mealForHour } from "./meals";
import { foodEntrySchema, foodUpdateSchema } from "./schema";
import { sumEntries, toFoodEntry } from "./totals";

describe("mealForHour", () => {
  it("picks a sensible meal for the time of day", () => {
    expect(mealForHour(8)).toBe("breakfast");
    expect(mealForHour(12)).toBe("lunch");
    expect(mealForHour(16)).toBe("snack");
    expect(mealForHour(19)).toBe("dinner");
    expect(mealForHour(23)).toBe("snack");
    expect(mealForHour(2)).toBe("snack");
  });

  it("uses the person's timezone", () => {
    const instant = new Date("2026-11-08T02:30:00Z"); // 08:00 in Kolkata
    expect(currentMeal("Asia/Kolkata", instant)).toBe("breakfast");
    expect(currentMeal("UTC", instant)).toBe("snack");
  });
});

describe("loggedAtFor", () => {
  const now = new Date("2026-11-08T10:15:00Z");

  it("uses the current time for today", () => {
    expect(loggedAtFor("2026-11-08", "lunch", "UTC", now)).toEqual(now);
  });

  it("uses a typical meal time for another day, in the person's timezone", () => {
    // 19:00 in Kolkata on 7 Nov is 13:30 UTC
    expect(loggedAtFor("2026-11-07", "dinner", "Asia/Kolkata", now).toISOString()).toBe(
      "2026-11-07T13:30:00.000Z",
    );
  });
});

describe("foodEntrySchema", () => {
  const valid = {
    day: "2026-11-08",
    meal: "lunch",
    name: "  Dal and rice ",
    calories: "395",
    protein: "14",
    carbs: "",
    fat: "6.5",
  };

  it("reads form text and trims the name", () => {
    const result = foodEntrySchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Dal and rice");
      expect(result.data.calories).toBe(395);
      expect(result.data.carbs).toBe(0); // empty means zero
      expect(result.data.fat).toBe(6.5);
    }
  });

  it("rejects missing names, bad calories and bad days", () => {
    expect(foodEntrySchema.safeParse({ ...valid, name: "  " }).success).toBe(false);
    expect(foodEntrySchema.safeParse({ ...valid, calories: "-5" }).success).toBe(false);
    expect(foodEntrySchema.safeParse({ ...valid, calories: "" }).success).toBe(false);
    expect(foodEntrySchema.safeParse({ ...valid, calories: "99999" }).success).toBe(false);
    expect(foodEntrySchema.safeParse({ ...valid, day: "2026-02-30" }).success).toBe(false);
    expect(foodEntrySchema.safeParse({ ...valid, meal: "brunch" }).success).toBe(false);
  });

  it("rejects negative macros", () => {
    expect(foodEntrySchema.safeParse({ ...valid, protein: "-1" }).success).toBe(false);
  });

  it("requires a real id to update", () => {
    expect(foodUpdateSchema.safeParse({ ...valid, id: "nope" }).success).toBe(false);
    expect(
      foodUpdateSchema.safeParse({ ...valid, id: "4e35de62-5689-4355-a047-f916fff09b2a" }).success,
    ).toBe(true);
  });
});

describe("sumEntries and toFoodEntry", () => {
  it("adds calories and macros", () => {
    const totals = sumEntries([
      { calories: 300.4, protein_g: 10, carbs_g: 40.25, fat_g: 5 },
      { calories: 250.2, protein_g: 12.3, carbs_g: 10, fat_g: 8.1 },
    ]);
    expect(totals).toEqual({ calories: 551, proteinG: 22.3, carbsG: 50.3, fatG: 13.1 });
  });

  it("is all zeros for an empty day", () => {
    expect(sumEntries([])).toEqual({ calories: 0, proteinG: 0, carbsG: 0, fatG: 0 });
  });

  it("turns database rows with string numbers into numbers", () => {
    const entry = toFoodEntry({
      id: "a",
      name: "Roti",
      meal_type: "lunch",
      calories: "130.0",
      protein_g: "3",
      carbs_g: null,
      fat_g: "1.2",
      logged_at: "2026-11-08T07:30:00Z",
    });
    expect(entry.calories).toBe(130);
    expect(entry.carbs_g).toBe(0);
    expect(entry.fat_g).toBe(1.2);
  });
});
