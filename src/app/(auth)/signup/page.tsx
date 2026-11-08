import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata: Metadata = { title: "Create account | APEX" };

export default function SignupPage() {
  return (
    <AuthShell
      title="Create your account"
      description="Start tracking meals and workouts with an AI coach."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="text-ice underline-offset-4 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <SignupForm />
    </AuthShell>
  );
}
