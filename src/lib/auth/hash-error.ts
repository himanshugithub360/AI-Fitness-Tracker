export type AuthLinkProblem = {
  /** Supabase's error code, for example "otp_expired". */
  code: string;
};

/**
 * Supabase puts the reason a confirmation or sign-in link failed in the part of the
 * address after the "#", where servers cannot see it. This reads it in the browser.
 * Returns null when the address carries no error.
 */
export function parseAuthHashError(hash: string): AuthLinkProblem | null {
  const params = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
  const code = params.get("error_code") ?? params.get("error");
  return code ? { code } : null;
}

/** A plain-language explanation for a failed link. */
export function describeAuthLinkProblem(problem: AuthLinkProblem): string {
  if (problem.code === "otp_expired" || problem.code === "access_denied") {
    return "That email link has expired or was already used. Each link works once, and only the newest one counts. If you already clicked it, your account is ready and you can sign in below. If not, request a new link.";
  }
  return "That email link did not work. Request a new one, or sign in below.";
}
