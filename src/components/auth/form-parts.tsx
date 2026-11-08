import type { ComponentProps } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FormState } from "@/lib/auth/form-state";

/** Shows a form-level error or success note. */
export function FormMessage({ state }: { state: FormState }) {
  if (state.error) {
    return (
      <p
        role="alert"
        className="border-destructive/40 bg-destructive/10 text-destructive rounded-xl border px-4 py-3 text-sm"
      >
        {state.error}
      </p>
    );
  }
  if (state.message) {
    return (
      <p
        role="status"
        className="border-ok/40 bg-ok/10 text-ok rounded-xl border px-4 py-3 text-sm"
      >
        {state.message}
      </p>
    );
  }
  return null;
}

type FieldProps = ComponentProps<typeof Input> & {
  label: string;
  name: string;
  errors?: string[];
};

/** A labelled input with its validation message underneath. */
export function Field({ label, name, errors, id, ...props }: FieldProps) {
  const fieldId = id ?? `field-${name}`;
  const errorId = `${fieldId}-error`;
  const hasError = Boolean(errors?.length);

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={fieldId}>{label}</Label>
      <Input
        id={fieldId}
        name={name}
        aria-invalid={hasError || undefined}
        aria-describedby={hasError ? errorId : undefined}
        {...props}
      />
      {hasError && (
        <p id={errorId} className="text-destructive text-sm">
          {errors?.[0]}
        </p>
      )}
    </div>
  );
}
