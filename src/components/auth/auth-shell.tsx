import Link from "next/link";
import type { ReactNode } from "react";

type AuthShellProps = {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
};

/** The centered card that holds every sign-in style page. */
export function AuthShell({ title, description, children, footer }: AuthShellProps) {
  return (
    <div className="flex flex-col gap-6">
      <Link href="/" className="font-display text-2xl font-extrabold tracking-tight">
        APEX<span className="text-ember">.</span>
      </Link>
      <div className="glass flex flex-col gap-6 rounded-3xl p-6 sm:p-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold">{title}</h1>
          <p className="text-muted-foreground">{description}</p>
        </div>
        {children}
      </div>
      {footer && <p className="text-muted-foreground text-center text-sm">{footer}</p>}
    </div>
  );
}
