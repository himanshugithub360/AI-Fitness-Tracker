import { describe, expect, it } from "vitest";
import { onboardingSchema } from "./schema";

const valid = {
  displayName: "Asha",
  sex: "female",
  birthDate: "1996-04-12",
  units: "metric",
  heightCm: "165",
  weightKg: "62.5",
  activity: "moderate",
  goal: "lose_fat",
  targetWeightKg: "",
  calories: "1750",
};

describe("onboardingSchema", () => {
  it("accepts form values, which arrive as text", () => {
    const result = onboardingSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.heightCm).toBe(165);
      expect(result.data.weightKg).toBe(62.5);
      expect(result.data.calories).toBe(1750);
      expect(result.data.targetWeightKg).toBeUndefined();
    }
  });

  it("reads a target weight when one is given", () => {
    const result = onboardingSchema.safeParse({ ...valid, targetWeightKg: "58" });
    expect(result.success && result.data.targetWeightKg).toBe(58);
  });

  it("rejects people who are too young or too old", () => {
    const year = new Date().getFullYear();
    expect(onboardingSchema.safeParse({ ...valid, birthDate: `${year - 10}-01-01` }).success).toBe(
      false,
    );
    expect(onboardingSchema.safeParse({ ...valid, birthDate: `${year - 120}-01-01` }).success).toBe(
      false,
    );
  });

  it("rejects impossible dates and non-dates", () => {
    expect(onboardingSchema.safeParse({ ...valid, birthDate: "1996-13-45" }).success).toBe(false);
    expect(onboardingSchema.safeParse({ ...valid, birthDate: "last week" }).success).toBe(false);
  });

  it("rejects unrealistic body measurements", () => {
    expect(onboardingSchema.safeParse({ ...valid, heightCm: "20" }).success).toBe(false);
    expect(onboardingSchema.safeParse({ ...valid, weightKg: "900" }).success).toBe(false);
    expect(onboardingSchema.safeParse({ ...valid, weightKg: "" }).success).toBe(false);
  });

  it("keeps calories inside the safe range", () => {
    expect(onboardingSchema.safeParse({ ...valid, calories: "900" }).success).toBe(false);
    expect(onboardingSchema.safeParse({ ...valid, calories: "7000" }).success).toBe(false);
  });

  it("rejects choices that are not on the list", () => {
    expect(onboardingSchema.safeParse({ ...valid, goal: "get_huge_fast" }).success).toBe(false);
    expect(onboardingSchema.safeParse({ ...valid, activity: "athlete" }).success).toBe(false);
  });
});
