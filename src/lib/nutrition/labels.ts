import type { ActivityLevel, GoalType } from "./targets";

export const GOAL_LABELS: Record<GoalType, string> = {
  lose_fat: "Lose fat",
  maintain: "Stay the same",
  build_muscle: "Build muscle",
};

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: "Mostly sitting",
  light: "Lightly active",
  moderate: "Moderately active",
  active: "Very active",
  very_active: "Athlete",
};
