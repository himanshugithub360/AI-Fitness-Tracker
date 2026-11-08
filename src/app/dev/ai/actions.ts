"use server";

import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { assertDevPagesEnabled } from "@/lib/dev-pages";
import { AiRateLimitError, AiUnavailableError, TASK_ROUTES, getGateway } from "@/lib/ai";
import type { AiTask } from "@/lib/ai";
import type { PlaygroundState } from "./types";

const tasks = Object.keys(TASK_ROUTES) as [AiTask, ...AiTask[]];

const promptSchema = z.object({
  task: z.enum(tasks),
  prompt: z
    .string()
    .trim()
    .min(1, "Type a prompt first.")
    .max(2000, "Keep it under 2000 characters."),
});

/** Sends one tiny prompt to each provider to prove both keys work. */
export async function runProbes(): Promise<PlaygroundState> {
  assertDevPagesEnabled();
  const user = await requireUser();

  const results = await getGateway().probeAll(user.id);
  return {
    probes: results.map((r) => ({
      provider: r.provider,
      model: r.model,
      ok: r.ok,
      text: r.text,
      error: r.error,
      latencyMs: r.latencyMs,
      inputTokens: r.usage?.inputTokens,
      outputTokens: r.usage?.outputTokens,
    })),
  };
}

/** Runs a prompt through the gateway, with routing and fallback, like the real app would. */
export async function runPrompt(
  _prev: PlaygroundState,
  formData: FormData,
): Promise<PlaygroundState> {
  assertDevPagesEnabled();
  const user = await requireUser();

  const parsed = promptSchema.safeParse({
    task: formData.get("task"),
    prompt: formData.get("prompt"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  }

  try {
    const result = await getGateway().generateText({
      task: parsed.data.task,
      userId: user.id,
      input: { prompt: parsed.data.prompt },
      maxOutputTokens: 800,
    });
    return {
      answer: {
        text: result.data,
        provider: result.provider,
        model: result.model,
        latencyMs: result.latencyMs,
        inputTokens: result.usage.inputTokens,
        outputTokens: result.usage.outputTokens,
        fallbackUsed: result.fallbackUsed,
        attempts: result.attempts,
      },
    };
  } catch (error) {
    if (error instanceof AiRateLimitError) return { error: error.message };
    if (error instanceof AiUnavailableError) {
      return { error: "Every model on this route failed.", attempts: error.attempts };
    }
    console.error("[dev/ai] unexpected error", error);
    return { error: "Something unexpected went wrong. Check the server log." };
  }
}
