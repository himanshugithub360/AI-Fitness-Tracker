import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/app/:path*",
    "/dev/:path*",
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
  ],
};
