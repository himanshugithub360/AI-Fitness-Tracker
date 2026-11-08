import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

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
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("display_name, onboarded, timezone")
    .eq("id", user.id)
    .maybeSingle();

  const name = profile?.display_name ?? user.email?.split("@")[0] ?? "there";

  return (
    <>
      <div className="flex flex-col gap-3">
        <span className="eyebrow">Signed in</span>
        <h1 className="text-4xl font-bold sm:text-5xl">
          Hello, <span className="text-heat">{name}</span>
        </h1>
        <p className="text-muted-foreground max-w-xl text-lg">
          Your account works. Tracking, the dashboard and the AI coach arrive in the next stages.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardDescription>Account</CardDescription>
          <CardTitle>{user.email}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-2">
          {error ? (
            <Badge variant="destructive">Profile not found</Badge>
          ) : profile ? (
            <>
              <Badge variant="success">Profile ready</Badge>
              <Badge variant={profile.onboarded ? "success" : "gold"}>
                {profile.onboarded ? "Onboarded" : "Onboarding pending"}
              </Badge>
            </>
          ) : (
            <Badge variant="gold">No profile row yet</Badge>
          )}
          {error && (
            <p className="text-muted-foreground w-full text-sm">
              The database could not return your profile. Check that the migration in
              supabase/migrations has been run in Supabase.
            </p>
          )}
        </CardContent>
      </Card>
    </>
  );
}

function HomeSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-label="Loading your account">
      <div className="h-4 w-24 animate-pulse rounded-full bg-white/10" />
      <div className="h-12 w-72 animate-pulse rounded-xl bg-white/10" />
      <div className="h-32 w-full animate-pulse rounded-2xl bg-white/5" />
    </div>
  );
}
