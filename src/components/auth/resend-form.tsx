"use client";

import { useActionState } from "react";
import { resendConfirmation } from "@/app/(auth)/actions";
import { initialFormState } from "@/lib/auth/form-state";
import { Field, FormMessage } from "./form-parts";
import { SubmitButton } from "./submit-button";

/** Lets someone whose confirmation link failed ask for a fresh one. */
export function ResendForm() {
  const [state, action] = useActionState(resendConfirmation, initialFormState);

  return (
    <form
      action={action}
      className="border-border flex flex-col gap-3 rounded-2xl border p-4"
      noValidate
    >
      <p className="text-sm font-medium">Need a new confirmation email?</p>
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
      <SubmitButton variant="outline" pendingLabel="Sending">
        Resend confirmation email
      </SubmitButton>
    </form>
  );
}
