/**
 * Returns a safe in-app path to redirect to after sign-in.
 * Anything that is not a plain path on this site (an absolute URL, a protocol-relative
 * `//host`, a backslash trick) falls back to the default, which blocks open redirects.
 */
export function safeNextPath(next: string | null | undefined, fallback = "/app"): string {
  if (!next) return fallback;
  if (!next.startsWith("/")) return fallback;
  if (next.startsWith("//") || next.includes("\\")) return fallback;
  if (/[\u0000-\u001f]/.test(next)) return fallback;
  return next;
}
