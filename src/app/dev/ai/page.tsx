import type { Metadata } from "next";
import { TASK_ROUTES } from "@/lib/ai/models";
import { assertDevPagesEnabled } from "@/lib/dev-pages";
import { Playground } from "./playground";

export const metadata: Metadata = { title: "AI test | APEX", robots: { index: false } };

export default function DevAiPage() {
  assertDevPagesEnabled();

  const tasks = Object.entries(TASK_ROUTES).map(([task, route]) => ({
    task,
    route: route.map((r) => `${r.provider}/${r.model}`),
  }));

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-5 py-12 sm:px-8 sm:py-16">
      <header className="flex flex-col gap-3">
        <span className="eyebrow">Developer tool</span>
        <h1 className="text-4xl font-bold sm:text-5xl">AI gateway test</h1>
        <p className="text-muted-foreground max-w-xl">
          Proves that Mistral and Gemini both answer through the shared gateway. You must be signed
          in, because every call is counted against your account. Hidden in production unless
          ENABLE_DEV_PAGES is true.
        </p>
      </header>
      <Playground tasks={tasks} />
    </main>
  );
}
