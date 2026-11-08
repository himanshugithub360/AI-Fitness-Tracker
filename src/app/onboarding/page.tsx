import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { OnboardingWizard, type OnboardingDefaults } from "@/components/onboarding/wizard";
import { requireUser } from "@/lib/auth/session";
import {
  ACTIVITY_LEVELS,
  GOAL_TYPES,
  SEXES,
  type ActivityLevel,
  type GoalType,
  type Sex,
} from "@/lib/nutrition/targets";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Set up your plan | APEX" };

export default function OnboardingPage() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-8 px-5 py-10 sm:py-16">
      <Link href="/" className="font-display text-2xl font-extrabold tracking-tight">
        APEX<span className="text-ember">.</span>
      </Link>
      <Suspense fallback={<WizardSkeleton />}>
        <WizardLoader />
      </Suspense>
    </main>
  );
}

function pick<T extends string>(options: readonly T[], value: unknown): T | undefined {
  return options.find((option) => option === value);
}

const asNumber = (value: unknown) => {
  const n = Number(value);
  return value === null || value === undefined || Number.isNaN(n) ? undefined : n;
};

async function WizardLoader() {
  // Answers are different for every person, so skip prerendering.
  await connection();
  const user = await requireUser();
  const supabase = await createClient();

  const [{ data: profile }, { data: goal }] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, sex, birth_date, height_cm, weight_kg, units, activity_level")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("goals")
      .select("goal_type, target_weight_kg")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .maybeSingle(),
  ]);

  const defaults: OnboardingDefaults = {
    displayName: profile?.display_name ?? user.email?.split("@")[0] ?? "",
    sex: pick<Sex>(SEXES, profile?.sex),
    birthDate: profile?.birth_date ?? undefined,
    heightCm: asNumber(profile?.height_cm),
    weightKg: asNumber(profile?.weight_kg),
    units: profile?.units === "imperial" ? "imperial" : "metric",
    activity: pick<ActivityLevel>(ACTIVITY_LEVELS, profile?.activity_level),
    goal: pick<GoalType>(GOAL_TYPES, goal?.goal_type),
    targetWeightKg: asNumber(goal?.target_weight_kg),
  };

  return <OnboardingWizard defaults={defaults} />;
}

function WizardSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading">
      <div className="h-4 w-28 animate-pulse rounded-full bg-white/10" />
      <div className="h-12 w-72 animate-pulse rounded-xl bg-white/10" />
      <div className="h-40 w-full animate-pulse rounded-2xl bg-white/5" />
    </div>
  );
}
