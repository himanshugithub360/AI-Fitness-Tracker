import "server-only";
import { headers } from "next/headers";

/**
 * The public address of this site for the current request, for example
 * http://localhost:3000 or the Vercel preview URL. Used to build auth email links.
 * Supabase only honours redirect URLs on its allow list, so a forged Host header
 * cannot send anyone elsewhere.
 */
export async function getOrigin(): Promise<string> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  if (host) {
    const forwardedProto = requestHeaders.get("x-forwarded-proto");
    const proto = forwardedProto ?? (host.startsWith("localhost") ? "http" : "https");
    return `${proto}://${host}`;
  }
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}
