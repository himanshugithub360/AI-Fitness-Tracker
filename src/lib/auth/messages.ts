/** Turns a Supabase auth error into a sentence a person can act on. */
export function friendlyAuthError(error: { message?: string; code?: string }): string {
  const text = `${error.code ?? ""} ${error.message ?? ""}`.toLowerCase();

  if (text.includes("invalid login") || text.includes("invalid_credentials")) {
    return "That email and password do not match.";
  }
  if (text.includes("email not confirmed") || text.includes("email_not_confirmed")) {
    return "Confirm your email first. Check your inbox for the link.";
  }
  if (text.includes("rate limit") || text.includes("over_email_send_rate_limit")) {
    return "Too many emails sent. Wait a few minutes and try again.";
  }
  if (text.includes("weak_password") || text.includes("password should")) {
    return "That password is too weak. Try a longer one.";
  }
  if (text.includes("same_password")) {
    return "Choose a password you have not used for this account before.";
  }
  if (text.includes("provider is not enabled") || text.includes("unsupported provider")) {
    return "Google sign-in is not switched on yet.";
  }
  return "Something went wrong. Please try again.";
}
