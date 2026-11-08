"use client";

import { useActionState } from "react";
import { signUpWithPassword } from "@/app/(auth)/actions";
import { initialFormState } from "@/lib/auth/form-state";
import { Field, FormMessage } from "./form-parts";
import { GoogleButton } from "./google-button";
import { SubmitButton } from "./submit-button";

export function SignupForm() {
  const [state, action] = useActionState(signUpWithPassword, initialFormState);

  return (
    <div className="flex flex-col gap-5">
      <GoogleButton next="/app" />

      <div className="text-muted-foreground flex items-center gap-3 text-xs">
        <span className="bg-border h-px flex-1" />
        <span className="font-mono tracking-widest uppercase">or</span>
        <span className="bg-border h-px flex-1" />
      </div>

      <form action={action} className="flex flex-col gap-4" noValidate>
        <FormMessage state={state} />
        <Field
          label="Name"
          name="name"
          autoComplete="name"
          placeholder="Your name"
          defaultValue={state.values?.name}
          errors={state.fieldErrors?.name}
        />
        <Field
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          defaultValue={state.values?.email}
          errors={state.fieldErrors?.email}
        />
        <Field
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          errors={state.fieldErrors?.password}
        />
        <SubmitButton size="lg" pendingLabel="Creating account">
          Create account
        </SubmitButton>
      </form>
    </div>
  );
}
