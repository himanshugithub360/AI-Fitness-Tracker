import "server-only";
import { notFound } from "next/navigation";

/**
 * Developer tools such as /dev/ai are available locally and on previews that set
 * ENABLE_DEV_PAGES=true. In production they answer 404.
 */
export function assertDevPagesEnabled() {
  const inProduction = process.env.NODE_ENV === "production";
  if (inProduction && process.env.ENABLE_DEV_PAGES !== "true") notFound();
}
