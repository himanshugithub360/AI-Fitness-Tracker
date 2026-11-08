import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotForm } from "@/components/auth/forgot-form";

export const metadata: Metadata = { title: "Reset password | APEX" };

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Reset your password"
      description="Enter your email and we will send you a link to choose a new one."
      footer={
        <Link href="/login" className="text-ice underline-offset-4 hover:underline">
          Back to sign in
        </Link>
      }
    >
      <ForgotForm />
    </AuthShell>
  );
}
