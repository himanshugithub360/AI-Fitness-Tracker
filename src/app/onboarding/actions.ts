"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import type { FormState } from "@/lib/auth/form-state";
import { macrosForCalories } from "@/lib/nutrition/targets";
import { onboardingSchema } from "@/lib/onboarding/schema";
import { createClient } from "@/lib/supabase/server";

const oneDecimal = (value: number) => Math.round(value * 10) / 10;

/**
 * Saves the answers from the onboarding wizard: the body details on the profile and the
 * daily targets as the active goal. Macros are worked out here, never taken from the browser.
 */
export async function completeOnboarding(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();

  const parsed = onboardingSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    const fieldErrors = z.flattenError(parsed.error).fieldErrors;
    const first = Object.values(fieldErrors).flat()[0];
    return { error: first ?? "Check your answers and try again.", fieldErrors };
  }

  const d = parsed.data;
  const macros = macrosForCalories(d.calories, d.weightKg, d.goal);
  const supabase = await createClient();

  const { error: profileError } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      display_name: d.displayName,
      sex: d.sex,
      birth_date: d.birthDate,
      height_cm: oneDecimal(d.heightCm),
      weight_kg: oneDecimal(d.weightKg),
      activity_level: d.activity,
      units: d.units,
      timezone: d.timezone,
      onboarded: true,
    },
    { onConflict: "id" },
  );
  if (profileError) {
    console.error("[onboarding] profile save failed:", profileError.message);
    return { error: "We could not save your details. Please try again." };
  }

  // Only one goal can be active at a time, so retire the old one first.
  const { error: retireError } = await supabase
    .from("goals")
    .update({ is_active: false })
    .eq("user_id", user.id)
    .eq("is_active", true);
  if (retireError) {
    console.error("[onboarding] could not retire the old goal:", retireError.message);
    return { error: "We could not save your plan. Please try again." };
  }

  const { error: goalError } = await supabase.from("goals").insert({
    user_id: user.id,
    goal_type: d.goal,
    daily_calories: d.calories,
    protein_g: macros.proteinG,
    carbs_g: macros.carbsG,
    fat_g: macros.fatG,
    target_weight_kg: d.targetWeightKg ? oneDecimal(d.targetWeightKg) : null,
    is_active: true,
  });
  if (goalError) {
    console.error("[onboarding] goal save failed:", goalError.message);
    return { error: "We could not save your plan. Please try again." };
  }

  redirect("/app");
}
