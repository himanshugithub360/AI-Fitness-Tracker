"use client";

import { useActionState } from "react";
import { requestPasswordReset } from "@/app/(auth)/actions";
import { initialFormState } from "@/lib/auth/form-state";
import { Field, FormMessage } from "./form-parts";
import { SubmitButton } from "./submit-button";

export function ForgotForm() {
  const [state, action] = useActionState(requestPasswordReset, initialFormState);

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <FormMessage state={state} />
      <Field
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        defaultValue={state.values?.email}
        errors={state.fieldErrors?.email}
      />
      <SubmitButton size="lg" pendingLabel="Sending">
        Send reset link
      </SubmitButton>
    </form>
  );
}
