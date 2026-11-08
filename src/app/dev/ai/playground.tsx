"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/components/auth/submit-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { runPrompt, runProbes } from "./actions";
import type { AttemptView, PlaygroundState } from "./types";

type TaskOption = { task: string; route: string[] };

const empty: PlaygroundState = {};

const controlClass =
  "w-full rounded-xl border border-input bg-white/[.04] px-4 text-base outline-none transition-colors hover:border-ring/40 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 md:text-sm";

function Attempts({ attempts }: { attempts: AttemptView[] }) {
  return (
    <ol className="flex flex-col gap-2">
      {attempts.map((a, i) => (
        <li
          key={`${a.provider}-${a.model}-${i}`}
          className="border-border flex flex-wrap items-center gap-2 rounded-xl border px-3 py-2 text-sm"
        >
          <Badge variant={a.ok ? "success" : "destructive"}>{a.ok ? "answered" : "failed"}</Badge>
          <span className="font-mono text-xs">
            {a.provider}/{a.model}
          </span>
          <span className="text-muted-foreground font-mono text-xs">{a.latencyMs} ms</span>
          {a.error && <span className="text-destructive w-full text-xs">{a.error}</span>}
        </li>
      ))}
    </ol>
  );
}

export function Playground({ tasks }: { tasks: TaskOption[] }) {
  const [probeState, probeAction] = useActionState(runProbes, empty);
  const [promptState, promptAction] = useActionState(runPrompt, empty);

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardDescription>Check 1</CardDescription>
          <CardTitle>Do both providers answer?</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-muted-foreground">
            Sends one tiny prompt straight to the cheapest Mistral model and the cheapest Gemini
            model, with no fallback.
          </p>
          <form action={probeAction}>
            <SubmitButton pendingLabel="Asking both models">Test both providers</SubmitButton>
          </form>
          {probeState.probes && (
            <ul className="flex flex-col gap-2">
              {probeState.probes.map((p) => (
                <li
                  key={`${p.provider}-${p.model}`}
                  className="border-border flex flex-col gap-1 rounded-xl border px-3 py-3"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={p.ok ? "success" : "destructive"}>
                      {p.ok ? "working" : "failed"}
                    </Badge>
                    <span className="font-mono text-xs">
                      {p.provider}/{p.model}
                    </span>
                    <span className="text-muted-foreground font-mono text-xs">
                      {p.latencyMs} ms
                      {p.inputTokens !== undefined &&
                        ` · ${p.inputTokens} in / ${p.outputTokens} out`}
                    </span>
                  </div>
                  {p.ok ? (
                    <p className="text-sm">Reply: {p.text || "(empty)"}</p>
                  ) : (
                    <p className="text-destructive text-sm">{p.error}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardDescription>Check 2</CardDescription>
          <CardTitle>Run a prompt through the gateway</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={promptAction} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="task">Task</Label>
              <select id="task" name="task" defaultValue="quick" className={`${controlClass} h-11`}>
                {tasks.map((t) => (
                  <option key={t.task} value={t.task}>
                    {t.task} ({t.route.join(" → ")})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="prompt">Prompt</Label>
              <textarea
                id="prompt"
                name="prompt"
                rows={4}
                maxLength={2000}
                defaultValue="Name three protein-rich Indian vegetarian dishes and give a rough calorie count for one serving of each."
                className={`${controlClass} py-3`}
              />
            </div>
            <SubmitButton pendingLabel="Thinking">Send</SubmitButton>
          </form>

          {promptState.error && (
            <div className="mt-4 flex flex-col gap-3">
              <p
                role="alert"
                className="border-destructive/40 bg-destructive/10 text-destructive rounded-xl border px-4 py-3 text-sm"
              >
                {promptState.error}
              </p>
              {promptState.attempts && <Attempts attempts={promptState.attempts} />}
            </div>
          )}

          {promptState.answer && (
            <div className="mt-4 flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="ice">
                  {promptState.answer.provider}/{promptState.answer.model}
                </Badge>
                {promptState.answer.fallbackUsed && <Badge variant="gold">fallback used</Badge>}
                <span className="text-muted-foreground font-mono text-xs">
                  {promptState.answer.latencyMs} ms · {promptState.answer.inputTokens} in /{" "}
                  {promptState.answer.outputTokens} out
                </span>
              </div>
              <p className="border-border rounded-xl border bg-white/[.03] p-4 text-sm leading-relaxed whitespace-pre-wrap">
                {promptState.answer.text}
              </p>
              {promptState.answer.fallbackUsed && (
                <Attempts attempts={promptState.answer.attempts} />
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
