import Link from "next/link";
import { LogOut } from "lucide-react";
import { signOut } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-border/60 border-b">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-5 sm:px-8">
          <Link href="/app" className="font-display text-xl font-extrabold tracking-tight">
            APEX<span className="text-ember">.</span>
          </Link>
          <form action={signOut}>
            <Button type="submit" variant="ghost" size="sm">
              <LogOut /> Sign out
            </Button>
          </form>
        </div>
      </header>
      {children}
    </div>
  );
}
