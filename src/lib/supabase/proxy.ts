import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseEnv } from "./env";

/** Pages that need a signed-in user. */
const PROTECTED_PREFIXES = ["/app", "/dev"];
/** Pages that make no sense once you are signed in. */
const GUEST_ONLY_PATHS = ["/login", "/signup", "/forgot-password"];

function matchesPrefix(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/**
 * Refreshes the Supabase session cookie and does a quick, optimistic redirect for
 * signed-out visitors. This is a convenience, not the security boundary: every
 * page and action re-checks the user, and the database enforces row level security.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { url, anonKey } = getSupabaseEnv();

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
        for (const [key, value] of Object.entries(headers)) response.headers.set(key, value);
      },
    },
  });

  // Verifies the token signature, so the result can be trusted.
  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims?.sub);
  const { pathname, search } = request.nextUrl;

  const redirectWithCookies = (target: string, params?: Record<string, string>) => {
    const destination = request.nextUrl.clone();
    destination.pathname = target;
    destination.search = "";
    for (const [key, value] of Object.entries(params ?? {})) {
      destination.searchParams.set(key, value);
    }
    const redirect = NextResponse.redirect(destination);
    for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
    return redirect;
  };

  if (!signedIn && PROTECTED_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix))) {
    return redirectWithCookies("/login", { next: `${pathname}${search}` });
  }

  if (signedIn && GUEST_ONLY_PATHS.includes(pathname)) {
    return redirectWithCookies("/app");
  }

  return response;
}
