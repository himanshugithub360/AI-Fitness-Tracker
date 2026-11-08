"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getOrigin } from "@/lib/auth/origin";
import { safeNextPath } from "@/lib/auth/redirects";
import { friendlyAuthError } from "@/lib/auth/messages";
import type { FormState } from "@/lib/auth/form-state";
import {
  forgotPasswordSchema,
  loginSchema,
  magicLinkSchema,
  resetPasswordSchema,
  signupSchema,
} from "@/lib/auth/schemas";

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

/** Values to put back in the form after a failed attempt. Never includes passwords. */
function keep(formData: FormData, ...keys: string[]) {
  return Object.fromEntries(keys.map((key) => [key, text(formData, key)]));
}

function invalid(error: z.ZodError, summary: string, values?: Record<string, string>): FormState {
  return { error: summary, fieldErrors: z.flattenError(error).fieldErrors, values };
}

export async function loginWithPassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = keep(formData, "email");
  const parsed = loginSchema.safeParse({
    email: text(formData, "email"),
    password: text(formData, "password"),
  });
  if (!parsed.success) return invalid(parsed.error, "Check your email and password.", values);

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: friendlyAuthError(error), values };

  redirect(safeNextPath(text(formData, "next")));
}

export async function signUpWithPassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = keep(formData, "name", "email");
  const parsed = signupSchema.safeParse({
    name: text(formData, "name"),
    email: text(formData, "email"),
    password: text(formData, "password"),
  });
  if (!parsed.success) return invalid(parsed.error, "Fix the highlighted fields.", values);

  const supabase = await createClient();
  const origin = await getOrigin();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.name },
      emailRedirectTo: `${origin}/auth/callback?next=/app`,
    },
  });
  if (error) return { error: friendlyAuthError(error), values };

  // With email confirmation switched on there is no session yet.
  if (!data.session) {
    return { message: "Check your email for a link to confirm your account, then sign in." };
  }
  redirect("/app");
}

export async function sendMagicLink(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = keep(formData, "email");
  const parsed = magicLinkSchema.safeParse({ email: text(formData, "email") });
  if (!parsed.success) return invalid(parsed.error, "Enter a valid email address.", values);

  const supabase = await createClient();
  const origin = await getOrigin();
  const next = safeNextPath(text(formData, "next"));
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: { emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}` },
  });
  if (error) return { error: friendlyAuthError(error), values };

  return { message: "Check your email for a sign-in link." };
}

export async function signInWithGoogle(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const origin = await getOrigin();
  const next = safeNextPath(text(formData, "next"));
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}` },
  });

  if (error || !data.url) redirect("/login?error=google");
  redirect(data.url);
}

export async function requestPasswordReset(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const values = keep(formData, "email");
  const parsed = forgotPasswordSchema.safeParse({ email: text(formData, "email") });
  if (!parsed.success) return invalid(parsed.error, "Enter a valid email address.", values);

  const supabase = await createClient();
  const origin = await getOrigin();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });
  if (error && !error.message.toLowerCase().includes("not found")) {
    return { error: friendlyAuthError(error), values };
  }

  // Same answer whether or not the email has an account, so nobody can probe for accounts.
  return { message: "If that email has an account, a reset link is on its way." };
}

export async function updatePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = resetPasswordSchema.safeParse({
    password: text(formData, "password"),
    confirm: text(formData, "confirm"),
  });
  if (!parsed.success) return invalid(parsed.error, "Fix the highlighted fields.");

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return { error: "This reset link has expired. Request a new one." };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: friendlyAuthError(error) };

  redirect("/app");
}

export async function resendConfirmation(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = keep(formData, "email");
  const parsed = magicLinkSchema.safeParse({ email: text(formData, "email") });
  if (!parsed.success) return invalid(parsed.error, "Enter a valid email address.", values);

  const supabase = await createClient();
  const origin = await getOrigin();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email: parsed.data.email,
    options: { emailRedirectTo: `${origin}/auth/callback?next=/app` },
  });
  if (error) return { error: friendlyAuthError(error), values };

  // Same answer for every address, so nobody can probe for accounts.
  return {
    message:
      "If that address is waiting for confirmation, a new link is on its way. Use only the newest email.",
  };
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
