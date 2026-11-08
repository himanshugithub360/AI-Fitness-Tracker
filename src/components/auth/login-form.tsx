"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { loginWithPassword, sendMagicLink } from "@/app/(auth)/actions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { initialFormState } from "@/lib/auth/form-state";
import { safeNextPath } from "@/lib/auth/redirects";
import { Field, FormMessage } from "./form-parts";
import { GoogleButton } from "./google-button";
import { SubmitButton } from "./submit-button";

const URL_ERRORS: Record<string, string> = {
  auth: "That sign-in link did not work. Request a new one and try again.",
  google: "Google sign-in is not available yet. Use your email instead.",
};

export function LoginForm() {
  const searchParams = useSearchParams();
  const next = safeNextPath(searchParams.get("next"));
  const urlError = URL_ERRORS[searchParams.get("error") ?? ""];

  const [passwordState, passwordAction] = useActionState(loginWithPassword, initialFormState);
  const [magicState, magicAction] = useActionState(sendMagicLink, initialFormState);

  return (
    <div className="flex flex-col gap-5">
      {urlError && <FormMessage state={{ error: urlError }} />}

      <GoogleButton next={next} />

      <div className="text-muted-foreground flex items-center gap-3 text-xs">
        <span className="bg-border h-px flex-1" />
        <span className="font-mono tracking-widest uppercase">or</span>
        <span className="bg-border h-px flex-1" />
      </div>

      <Tabs defaultValue="password" className="gap-5">
        <TabsList className="w-full">
          <TabsTrigger value="password">Password</TabsTrigger>
          <TabsTrigger value="magic">Email link</TabsTrigger>
        </TabsList>

        <TabsContent value="password">
          <form action={passwordAction} className="flex flex-col gap-4" noValidate>
            <input type="hidden" name="next" value={next} />
            <FormMessage state={passwordState} />
            <Field
              label="Email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              defaultValue={passwordState.values?.email}
              errors={passwordState.fieldErrors?.email}
            />
            <Field
              label="Password"
              name="password"
              type="password"
              autoComplete="current-password"
              errors={passwordState.fieldErrors?.password}
            />
            <SubmitButton size="lg" pendingLabel="Signing in">
              Sign in
            </SubmitButton>
            <Link
              href="/forgot-password"
              className="text-ice text-center text-sm underline-offset-4 hover:underline"
            >
              Forgot your password?
            </Link>
          </form>
        </TabsContent>

        <TabsContent value="magic">
          <form action={magicAction} className="flex flex-col gap-4" noValidate>
            <input type="hidden" name="next" value={next} />
            <FormMessage state={magicState} />
            <Field
              label="Email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              defaultValue={magicState.values?.email}
              errors={magicState.fieldErrors?.email}
            />
            <SubmitButton size="lg" pendingLabel="Sending">
              Email me a sign-in link
            </SubmitButton>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
}
