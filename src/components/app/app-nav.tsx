"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, Utensils, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: LucideIcon };

/** Add a page here once it exists, so the menu never points at a dead end. */
const ITEMS: NavItem[] = [
  { href: "/app", label: "Today", icon: House },
  { href: "/app/food", label: "Food", icon: Utensils },
];

function isActive(pathname: string, href: string) {
  return href === "/app"
    ? pathname === "/app"
    : pathname === href || pathname.startsWith(`${href}/`);
}

/** Links in the header, shown on wider screens. */
export function DesktopNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
      {ITEMS.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "focus-visible:ring-ring/50 flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors outline-none focus-visible:ring-3",
              active
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground hover:bg-white/[.06]",
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

/** A tab bar fixed to the bottom of the screen on phones. */
export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main"
      className="border-border bg-background/90 fixed inset-x-0 bottom-0 z-30 border-t pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-around px-2">
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "focus-visible:text-foreground flex flex-col items-center gap-1 py-3 text-xs font-semibold transition-colors outline-none",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="size-5" aria-hidden="true" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
