import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Sign in | APEX" };

export default function LoginPage() {
  return (
    <AuthShell
      title="Welcome back"
      description="Sign in to pick up where you left off."
      footer={
        <>
          New to APEX?{" "}
          <Link href="/signup" className="text-ice underline-offset-4 hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
