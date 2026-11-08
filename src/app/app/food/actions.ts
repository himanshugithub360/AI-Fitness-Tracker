"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import type { FormState } from "@/lib/auth/form-state";
import { safeTimezone } from "@/lib/dates/tz";
import { loggedAtFor } from "@/lib/food/meals";
import { foodDeleteSchema, foodEntrySchema, foodUpdateSchema } from "@/lib/food/schema";
import { createClient } from "@/lib/supabase/server";

const round1 = (value: number) => Math.round(value * 10) / 10;

function refresh() {
  revalidatePath("/app/food");
  revalidatePath("/app");
}

function problems(error: z.ZodError): FormState {
  const fieldErrors = z.flattenError(error).fieldErrors;
  const first = Object.values(fieldErrors)
    .flat()
    .find((message): message is string => typeof message === "string");
  return { error: first ?? "Check the form and try again.", fieldErrors };
}

async function timezoneOf(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("timezone")
    .eq("id", userId)
    .maybeSingle();
  return safeTimezone(data?.timezone);
}

/** Adds a food to a meal on a day. Returns message "saved" so the form can close. */
export async function addFood(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();

  const parsed = foodEntrySchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return problems(parsed.error);
  const d = parsed.data;

  const timezone = await timezoneOf(user.id);
  const supabase = await createClient();
  const { error } = await supabase.from("food_logs").insert({
    user_id: user.id,
    logged_at: loggedAtFor(d.day, d.meal, timezone).toISOString(),
    meal_type: d.meal,
    name: d.name,
    calories: round1(d.calories),
    protein_g: round1(d.protein),
    carbs_g: round1(d.carbs),
    fat_g: round1(d.fat),
    source: "manual",
  });
  if (error) {
    console.error("[food] add failed:", error.message);
    return { error: "We could not save that. Please try again." };
  }

  refresh();
  return { message: "saved" };
}

/** Changes an existing entry. Moving it to another meal moves its time too. */
export async function updateFood(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();

  const parsed = foodUpdateSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return problems(parsed.error);
  const d = parsed.data;

  const supabase = await createClient();
  const { data: existing, error: findError } = await supabase
    .from("food_logs")
    .select("meal_type")
    .eq("id", d.id)
    .maybeSingle();
  if (findError || !existing) return { error: "That entry no longer exists." };

  const changes: Record<string, unknown> = {
    meal_type: d.meal,
    name: d.name,
    calories: round1(d.calories),
    protein_g: round1(d.protein),
    carbs_g: round1(d.carbs),
    fat_g: round1(d.fat),
  };
  if (existing.meal_type !== d.meal) {
    const timezone = await timezoneOf(user.id);
    changes.logged_at = loggedAtFor(d.day, d.meal, timezone).toISOString();
  }

  const { error } = await supabase.from("food_logs").update(changes).eq("id", d.id);
  if (error) {
    console.error("[food] update failed:", error.message);
    return { error: "We could not save your changes. Please try again." };
  }

  refresh();
  return { message: "saved" };
}

export async function deleteFood(formData: FormData): Promise<void> {
  await requireUser();

  const parsed = foodDeleteSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return;

  const supabase = await createClient();
  const { error } = await supabase.from("food_logs").delete().eq("id", parsed.data.id);
  if (error) console.error("[food] delete failed:", error.message);

  refresh();
}
