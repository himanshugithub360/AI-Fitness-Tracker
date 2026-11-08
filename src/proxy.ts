import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // If the Supabase "Site URL" or redirect list is not set up yet, Supabase sends the
  // sign-in code to the home page. Forward it to the callback so the sign-in still works.
  if (pathname === "/" && searchParams.has("code")) {
    const callback = request.nextUrl.clone();
    callback.pathname = "/auth/callback";
    if (!callback.searchParams.has("next")) callback.searchParams.set("next", "/app");
    return NextResponse.redirect(callback);
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    "/app/:path*",
    "/dev/:path*",
    "/onboarding/:path*",
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
    // Only the home page when it arrives with a sign-in code.
    { source: "/", has: [{ type: "query", key: "code" }] },
  ],
};
