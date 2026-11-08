"use client";

import type { ComponentProps } from "react";
import { useFormStatus } from "react-dom";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

type SubmitButtonProps = Omit<ComponentProps<typeof Button>, "type"> & {
  pendingLabel?: string;
};

export function SubmitButton({
  children,
  pendingLabel = "Working",
  disabled,
  ...props
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={pending || disabled}
      aria-disabled={pending || disabled}
      {...props}
    >
      {pending ? (
        <>
          <LoaderCircle className="animate-spin" aria-hidden="true" />
          {pendingLabel}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
