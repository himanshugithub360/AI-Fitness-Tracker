import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { DaySummary, type DayTargets } from "@/components/food/day-summary";
import { DaySwitcher } from "@/components/food/day-switcher";
import type { RecentFood } from "@/components/food/food-form";
import { MealSection } from "@/components/food/meal-section";
import { requireUser } from "@/lib/auth/session";
import { dayRange, isValidDay, safeTimezone, todayIn } from "@/lib/dates/tz";
import { MEAL_TYPES } from "@/lib/food/meals";
import { sumEntries, toFoodEntry } from "@/lib/food/totals";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Food | APEX" };

export default function FoodPage(props: PageProps<"/app/food">) {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-5 py-8 sm:px-8 sm:py-12">
      <Suspense fallback={<FoodSkeleton />}>
        <FoodContent searchParams={props.searchParams} />
      </Suspense>
    </main>
  );
}

async function FoodContent({
  searchParams,
}: {
  searchParams: PageProps<"/app/food">["searchParams"];
}) {
  // Each person's log is different, so skip prerendering.
  await connection();
  const user = await requireUser();
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("timezone, onboarded")
    .eq("id", user.id)
    .maybeSingle();
  if (profile && !profile.onboarded) redirect("/onboarding");

  const timezone = safeTimezone(profile?.timezone);
  const today = todayIn(timezone);
  const requested = (await searchParams).day;
  const day = typeof requested === "string" && isValidDay(requested) ? requested : today;
  const { start, end } = dayRange(day, timezone);

  const [{ data: rows }, { data: goal }, { data: recentRows }] = await Promise.all([
    supabase
      .from("food_logs")
      .select("id, name, meal_type, calories, protein_g, carbs_g, fat_g, logged_at")
      .gte("logged_at", start.toISOString())
      .lt("logged_at", end.toISOString())
      .order("logged_at", { ascending: true }),
    supabase
      .from("goals")
      .select("daily_calories, protein_g, carbs_g, fat_g")
      .eq("is_active", true)
      .maybeSingle(),
    supabase
      .from("food_logs")
      .select("name, calories, protein_g, carbs_g, fat_g")
      .order("logged_at", { ascending: false })
      .limit(80),
  ]);

  const entries = (rows ?? []).map(toFoodEntry);
  const totals = sumEntries(entries);

  const targets: DayTargets | null = goal
    ? {
        calories: Number(goal.daily_calories),
        proteinG: goal.protein_g === null ? null : Number(goal.protein_g),
        carbsG: goal.carbs_g === null ? null : Number(goal.carbs_g),
        fatG: goal.fat_g === null ? null : Number(goal.fat_g),
      }
    : null;

  // The foods this person logs most recently, one chip each, for quick re-adding.
  const seen = new Set<string>();
  const recent: RecentFood[] = [];
  for (const row of recentRows ?? []) {
    const key = String(row.name).trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    recent.push({
      name: String(row.name),
      calories: Number(row.calories) || 0,
      protein_g: Number(row.protein_g) || 0,
      carbs_g: Number(row.carbs_g) || 0,
      fat_g: Number(row.fat_g) || 0,
    });
    if (recent.length === 6) break;
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-4xl font-bold sm:text-5xl">Food</h1>
        <DaySwitcher day={day} today={today} />
      </div>

      <DaySummary totals={totals} targets={targets} />

      <div className="flex flex-col gap-4">
        {MEAL_TYPES.map((meal) => (
          <MealSection
            key={`${day}-${meal}`}
            meal={meal}
            day={day}
            recent={recent}
            entries={entries.filter((entry) => entry.meal_type === meal)}
          />
        ))}
      </div>
    </>
  );
}

function FoodSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading your food log">
      <div className="h-12 w-48 animate-pulse rounded-xl bg-white/10" />
      <div className="h-44 w-full animate-pulse rounded-3xl bg-white/5" />
      <div className="h-32 w-full animate-pulse rounded-3xl bg-white/5" />
      <div className="h-32 w-full animate-pulse rounded-3xl bg-white/5" />
    </div>
  );
}
