import Link from "next/link";
import { LogOut } from "lucide-react";
import { signOut } from "@/app/(auth)/actions";
import { DesktopNav, MobileNav } from "@/components/app/app-nav";
import { Button } from "@/components/ui/button";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col pb-24 md:pb-0">
      <header className="border-border/60 bg-background/80 sticky top-0 z-30 border-b backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between gap-4 px-5 sm:px-8">
          <Link href="/app" className="font-display text-xl font-extrabold tracking-tight">
            APEX<span className="text-ember">.</span>
          </Link>
          <DesktopNav />
          <form action={signOut}>
            <Button type="submit" variant="ghost" size="sm">
              <LogOut /> Sign out
            </Button>
          </form>
        </div>
      </header>
      {children}
      <MobileNav />
    </div>
  );
}
