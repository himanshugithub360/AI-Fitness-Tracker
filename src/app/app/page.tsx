import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { ACTIVITY_LABELS, GOAL_LABELS } from "@/lib/nutrition/labels";
import {
  ACTIVITY_LEVELS,
  GOAL_TYPES,
  type ActivityLevel,
  type GoalType,
} from "@/lib/nutrition/targets";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Your day | APEX" };

export default function AppHomePage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-5 py-12 sm:px-8">
      <Suspense fallback={<HomeSkeleton />}>
        <HomeContent />
      </Suspense>
    </main>
  );
}

async function HomeContent() {
  // Signed-in content is different for every request, so skip prerendering it.
  await connection();
  const user = await requireUser();
  const supabase = await createClient();

  const [{ data: profile, error }, { data: goal }] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, onboarded, activity_level")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("goals")
      .select("goal_type, daily_calories, protein_g, carbs_g, fat_g, target_weight_kg")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .maybeSingle(),
  ]);

  // New accounts set up their plan first.
  if (profile && !profile.onboarded) redirect("/onboarding");

  const name = profile?.display_name ?? user.email?.split("@")[0] ?? "there";
  const goalType = GOAL_TYPES.find((g) => g === goal?.goal_type) as GoalType | undefined;
  const activity = ACTIVITY_LEVELS.find((a) => a === profile?.activity_level) as
    ActivityLevel | undefined;

  return (
    <>
      <div className="flex flex-col gap-3">
        <span className="eyebrow">Your day</span>
        <h1 className="text-4xl font-bold sm:text-5xl">
          Hello, <span className="text-heat">{name}</span>
        </h1>
        <p className="text-muted-foreground max-w-xl text-lg">
          Your plan is ready. Logging meals and activity comes next.
        </p>
      </div>

      {error && (
        <p
          role="alert"
          className="border-destructive/40 bg-destructive/10 text-destructive rounded-xl border px-4 py-3 text-sm"
        >
          We could not load your profile. Try refreshing the page.
        </p>
      )}

      {goal && (
        <Card>
          <CardHeader>
            <CardDescription>Your daily targets</CardDescription>
            <CardTitle className="font-display text-5xl font-bold tabular-nums">
              {goal.daily_calories.toLocaleString("en-US")}
              <span className="text-muted-foreground ml-2 text-lg font-medium">kcal</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { label: "Protein", value: goal.protein_g, color: "bg-ice" },
                { label: "Carbs", value: goal.carbs_g, color: "bg-gold" },
                { label: "Fat", value: goal.fat_g, color: "bg-ember" },
              ].map((macro) => (
                <div
                  key={macro.label}
                  className="border-border rounded-2xl border bg-white/[.03] p-4"
                >
                  <span
                    className={cn("mx-auto mb-2 block h-1.5 w-8 rounded-full", macro.color)}
                    aria-hidden="true"
                  />
                  <p className="font-display text-3xl font-bold tabular-nums">
                    {macro.value ?? 0}g
                  </p>
                  <p className="text-muted-foreground font-mono text-xs tracking-widest uppercase">
                    {macro.label}
                  </p>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {goalType && <Badge variant="ice">{GOAL_LABELS[goalType]}</Badge>}
              {activity && <Badge variant="secondary">{ACTIVITY_LABELS[activity]}</Badge>}
              {goal.target_weight_kg && (
                <Badge variant="gold">Target {Number(goal.target_weight_kg)} kg</Badge>
              )}
              <Link
                href="/onboarding"
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "ml-auto")}
              >
                <Pencil /> Edit plan
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {!goal && profile?.onboarded && (
        <Card>
          <CardHeader>
            <CardTitle>No active plan</CardTitle>
            <CardDescription>Set your daily targets to get started.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/onboarding" className={buttonVariants()}>
              Set up my plan
            </Link>
          </CardContent>
        </Card>
      )}
    </>
  );
}

function HomeSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-label="Loading your day">
      <div className="h-4 w-24 animate-pulse rounded-full bg-white/10" />
      <div className="h-12 w-72 animate-pulse rounded-xl bg-white/10" />
      <div className="h-56 w-full animate-pulse rounded-2xl bg-white/5" />
    </div>
  );
}
