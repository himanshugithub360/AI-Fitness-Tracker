import { describe, expect, it } from "vitest";
import {
  ageOn,
  basalMetabolicRate,
  calculateTargets,
  caloriesFromMacros,
  cmToFtIn,
  ftInToCm,
  kgToLb,
  lbToKg,
  macrosForCalories,
  MAX_CALORIES,
  MIN_CALORIES,
  type TargetInput,
} from "./targets";

const man: TargetInput = {
  sex: "male",
  age: 28,
  heightCm: 178,
  weightKg: 76,
  activity: "moderate",
  goal: "maintain",
};

describe("ageOn", () => {
  it("counts whole years and respects the birthday", () => {
    const today = new Date(2026, 10, 8); // 8 Nov 2026
    expect(ageOn("1998-11-08", today)).toBe(28); // birthday today
    expect(ageOn("1998-11-09", today)).toBe(27); // birthday tomorrow
    expect(ageOn("1998-01-01", today)).toBe(28);
  });
});

describe("basalMetabolicRate", () => {
  it("matches the Mifflin-St Jeor equation", () => {
    // 10*76 + 6.25*178 - 5*28 + 5 = 760 + 1112.5 - 140 + 5
    expect(basalMetabolicRate(man)).toBeCloseTo(1737.5, 5);
    expect(basalMetabolicRate({ ...man, sex: "female" })).toBeCloseTo(1571.5, 5);
    expect(basalMetabolicRate({ ...man, sex: "other" })).toBeCloseTo(1654.5, 5);
  });
});

describe("calculateTargets", () => {
  it("uses maintenance for the maintain goal", () => {
    const t = calculateTargets(man);
    expect(t.bmr).toBe(1738);
    expect(t.maintenance).toBe(2693); // 1737.5 * 1.55
    expect(t.calories).toBe(2690);
  });

  it("eats less to lose fat and more to build muscle", () => {
    const lose = calculateTargets({ ...man, goal: "lose_fat" });
    const build = calculateTargets({ ...man, goal: "build_muscle" });
    expect(lose.calories).toBe(2190);
    expect(build.calories).toBe(2990);
  });

  it("scales with activity", () => {
    const low = calculateTargets({ ...man, activity: "sedentary" });
    const high = calculateTargets({ ...man, activity: "very_active" });
    expect(high.calories).toBeGreaterThan(low.calories);
  });

  it("never suggests fewer than the minimum calories", () => {
    const tiny = calculateTargets({
      sex: "female",
      age: 70,
      heightCm: 145,
      weightKg: 40,
      activity: "sedentary",
      goal: "lose_fat",
    });
    expect(tiny.calories).toBe(MIN_CALORIES);
  });

  it("never suggests more than the maximum calories", () => {
    const huge = calculateTargets({
      sex: "male",
      age: 20,
      heightCm: 210,
      weightKg: 250,
      activity: "very_active",
      goal: "build_muscle",
    });
    expect(huge.calories).toBe(MAX_CALORIES);
  });
});

describe("macrosForCalories", () => {
  it("sets protein by body weight and goal", () => {
    expect(macrosForCalories(2000, 80, "lose_fat").proteinG).toBe(160);
    expect(macrosForCalories(2000, 80, "maintain").proteinG).toBe(128);
    expect(macrosForCalories(2000, 80, "build_muscle").proteinG).toBe(144);
  });

  it("takes a quarter of calories from fat", () => {
    expect(macrosForCalories(2000, 80, "maintain").fatG).toBe(56); // 500 kcal / 9
  });

  it("adds back up to the calorie target, within rounding", () => {
    for (const calories of [1500, 2000, 2690, 3500]) {
      const macros = macrosForCalories(calories, 76, "maintain");
      expect(Math.abs(caloriesFromMacros(macros) - calories)).toBeLessThanOrEqual(10);
    }
  });

  it("never returns negative carbs", () => {
    expect(macrosForCalories(1200, 140, "lose_fat").carbsG).toBe(0);
  });
});

describe("unit conversion", () => {
  it("converts pounds and kilograms", () => {
    expect(lbToKg(176)).toBeCloseTo(79.83, 1);
    expect(kgToLb(80)).toBeCloseTo(176.37, 1);
    expect(lbToKg(kgToLb(76))).toBeCloseTo(76, 6);
  });

  it("converts feet and inches", () => {
    expect(ftInToCm(5, 10)).toBeCloseTo(177.8, 1);
    expect(cmToFtIn(177.8)).toEqual({ feet: 5, inches: 10 });
    expect(cmToFtIn(152.4)).toEqual({ feet: 5, inches: 0 });
  });
});
