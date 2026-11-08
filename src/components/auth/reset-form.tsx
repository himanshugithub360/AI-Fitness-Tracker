"use client";

import { useActionState } from "react";
import { updatePassword } from "@/app/(auth)/actions";
import { initialFormState } from "@/lib/auth/form-state";
import { Field, FormMessage } from "./form-parts";
import { SubmitButton } from "./submit-button";

export function ResetForm() {
  const [state, action] = useActionState(updatePassword, initialFormState);

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <FormMessage state={state} />
      <Field
        label="New password"
        name="password"
        type="password"
        autoComplete="new-password"
        placeholder="At least 8 characters"
        errors={state.fieldErrors?.password}
      />
      <Field
        label="Confirm password"
        name="confirm"
        type="password"
        autoComplete="new-password"
        errors={state.fieldErrors?.confirm}
      />
      <SubmitButton size="lg" pendingLabel="Saving">
        Save new password
      </SubmitButton>
    </form>
  );
}
