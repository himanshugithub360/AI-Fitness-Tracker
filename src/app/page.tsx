import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const checklist = [
  { label: "Next.js, TypeScript and Tailwind running", done: true },
  { label: "APEX design system", done: true },
  { label: "Database and security rules", done: false },
  { label: "Sign-up and login", done: false },
  { label: "Mistral and Gemini gateway", done: false },
];

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-8 px-6 py-24">
      <div className="flex flex-col gap-3">
        <span className="eyebrow">Stage 1 / Foundation</span>
        <h1 className="font-display text-6xl font-bold">
          APEX<span className="text-ember">.</span>
        </h1>
        <p className="text-muted-foreground max-w-md text-lg">
          The app skeleton is running. The real landing page and features come in later stages.
        </p>
        <div className="pt-2">
          <Button asChild>
            <Link href="/style-guide">
              See the style guide <ArrowRight />
            </Link>
          </Button>
        </div>
      </div>
      <ul className="flex flex-col gap-2">
        {checklist.map((item) => (
          <li key={item.label} className="glass flex items-center gap-3 rounded-xl px-4 py-3">
            <span
              className={`size-2.5 rounded-full ${item.done ? "bg-ice shadow-[0_0_10px_var(--ice)]" : "bg-white/20"}`}
              aria-hidden="true"
            />
            <span className={item.done ? "" : "text-muted-foreground"}>{item.label}</span>
            <span className="sr-only">{item.done ? "done" : "not done yet"}</span>
          </li>
        ))}
      </ul>
    </main>
  );
}
