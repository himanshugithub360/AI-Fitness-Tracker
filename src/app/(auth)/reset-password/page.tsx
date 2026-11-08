import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { ResetForm } from "@/components/auth/reset-form";

export const metadata: Metadata = { title: "Choose a new password | APEX" };

export default function ResetPasswordPage() {
  return (
    <AuthShell
      title="Choose a new password"
      description="Pick something you have not used for this account before."
    >
      <ResetForm />
    </AuthShell>
  );
}
