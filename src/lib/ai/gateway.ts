import { generateText as sdkGenerateText, Output, type LanguageModel, type ModelMessage } from "ai";
import type { z } from "zod";
import { AiRateLimitError, AiUnavailableError } from "./errors";
import { PROBE_TARGETS, TASK_ROUTES } from "./models";
import { estimateCostUsd } from "./pricing";
import type { ModelResolver } from "./providers";
import type {
  AiResult,
  AiTask,
  Attempt,
  ModelRef,
  TokenUsage,
  UsageRow,
  UsageStore,
} from "./types";

export type GatewayDeps = {
  resolveModel: ModelResolver;
  usage: UsageStore;
  /** Which models answer each task. Defaults to TASK_ROUTES. */
  routes?: Record<AiTask, ModelRef[]>;
  /** Successful calls allowed per user in any rolling 24 hours. */
  dailyLimit?: number;
  /**
   * When the usage table cannot be read: true lets the call through (handy in
   * development), false blocks it (safer in production, where it protects cost).
   */
  failOpen?: boolean;
  defaultTimeoutMs?: number;
  now?: () => number;
};

type PromptInput = { prompt: string } | { messages: ModelMessage[] };

export type AiCallOptions = {
  task: AiTask;
  userId: string;
  system?: string;
  /** Pass either a prompt or a list of messages. */
  input: PromptInput;
  maxOutputTokens?: number;
  temperature?: number;
  timeoutMs?: number;
  /** Use these models instead of the task's default route. */
  route?: ModelRef[];
};

export type ProbeResult = {
  provider: ModelRef["provider"];
  model: string;
  ok: boolean;
  text?: string;
  error?: string;
  latencyMs: number;
  usage?: TokenUsage;
};

const DAY_MS = 24 * 60 * 60 * 1000;

function errorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message.replace(/\s+/g, " ").slice(0, 300);
}

function toUsage(usage: { inputTokens?: number; outputTokens?: number }): TokenUsage {
  return { inputTokens: usage.inputTokens ?? 0, outputTokens: usage.outputTokens ?? 0 };
}

export function createGateway(deps: GatewayDeps) {
  const routes = deps.routes ?? TASK_ROUTES;
  const dailyLimit = deps.dailyLimit ?? 100;
  const failOpen = deps.failOpen ?? process.env.NODE_ENV !== "production";
  const defaultTimeoutMs = deps.defaultTimeoutMs ?? 45_000;
  const now = deps.now ?? Date.now;

  async function record(row: UsageRow) {
    try {
      await deps.usage.record(row);
    } catch (error) {
      // Logging must never break a user's request.
      console.error("[ai] could not record usage:", errorMessage(error));
    }
  }

  async function enforceLimit(userId: string) {
    let used = 0;
    try {
      used = await deps.usage.countSuccessesSince(userId, new Date(now() - DAY_MS));
    } catch (error) {
      if (!failOpen) throw error;
      console.warn("[ai] usage count unavailable, allowing the call:", errorMessage(error));
      return;
    }
    if (used >= dailyLimit) throw new AiRateLimitError(dailyLimit);
  }

  /** Tries each model on the route until one answers. */
  async function execute<T>(
    options: AiCallOptions,
    call: (model: LanguageModel, timeoutMs: number) => Promise<{ value: T; usage: TokenUsage }>,
  ): Promise<AiResult<T>> {
    await enforceLimit(options.userId);

    const route = options.route ?? routes[options.task];
    const timeoutMs = options.timeoutMs ?? defaultTimeoutMs;
    const attempts: Attempt[] = [];

    for (const ref of route) {
      const started = now();
      try {
        const model = deps.resolveModel(ref);
        const { value, usage } = await call(model, timeoutMs);
        const latencyMs = now() - started;
        attempts.push({ ...ref, ok: true, latencyMs });
        await record({
          ...ref,
          userId: options.userId,
          task: options.task,
          inputTokens: usage.inputTokens,
          outputTokens: usage.outputTokens,
          costUsd: estimateCostUsd(ref.model, usage.inputTokens, usage.outputTokens),
          latencyMs,
          success: true,
        });
        return {
          data: value,
          provider: ref.provider,
          model: ref.model,
          usage,
          latencyMs,
          attempts,
          fallbackUsed: attempts.length > 1,
        };
      } catch (error) {
        const latencyMs = now() - started;
        const message = errorMessage(error);
        attempts.push({ ...ref, ok: false, error: message, latencyMs });
        await record({
          ...ref,
          userId: options.userId,
          task: options.task,
          inputTokens: 0,
          outputTokens: 0,
          costUsd: 0,
          latencyMs,
          success: false,
          error: message,
        });
      }
    }

    throw new AiUnavailableError(attempts);
  }

  /** Plain text answer. */
  function generateText(options: AiCallOptions): Promise<AiResult<string>> {
    return execute(options, async (model, timeoutMs) => {
      const result = await sdkGenerateText({
        model,
        system: options.system,
        ...options.input,
        maxOutputTokens: options.maxOutputTokens,
        temperature: options.temperature,
        timeout: timeoutMs,
        maxRetries: 1,
      });
      return { value: result.text, usage: toUsage(result.usage) };
    });
  }

  /**
   * A structured answer checked against a Zod schema. A reply that does not match the
   * schema counts as a failure, so the next model on the route gets a turn.
   */
  function generateObject<S extends z.ZodType>(
    options: AiCallOptions & { schema: S },
  ): Promise<AiResult<z.infer<S>>> {
    return execute(options, async (model, timeoutMs) => {
      const result = await sdkGenerateText({
        model,
        system: options.system,
        ...options.input,
        output: Output.object({ schema: options.schema }),
        maxOutputTokens: options.maxOutputTokens,
        temperature: options.temperature,
        timeout: timeoutMs,
        maxRetries: 1,
      });
      return { value: result.output as z.infer<S>, usage: toUsage(result.usage) };
    });
  }

  /**
   * Sends one tiny prompt to a single model with no fallback. Used to prove that a
   * provider key works. Never throws: the outcome is in the result.
   */
  async function probe(ref: ModelRef, userId: string): Promise<ProbeResult> {
    const started = now();
    try {
      const model = deps.resolveModel(ref);
      const result = await sdkGenerateText({
        model,
        prompt: "Reply with the single word: ready",
        // Some models spend tokens thinking before they answer, so leave room.
        maxOutputTokens: 400,
        timeout: 30_000,
        maxRetries: 0,
      });
      const latencyMs = now() - started;
      const usage = toUsage(result.usage);
      await record({
        ...ref,
        userId,
        task: "probe",
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
        costUsd: estimateCostUsd(ref.model, usage.inputTokens, usage.outputTokens),
        latencyMs,
        success: true,
      });
      return { ...ref, ok: true, text: result.text.trim(), latencyMs, usage };
    } catch (error) {
      const latencyMs = now() - started;
      const message = errorMessage(error);
      await record({
        ...ref,
        userId,
        task: "probe",
        inputTokens: 0,
        outputTokens: 0,
        costUsd: 0,
        latencyMs,
        success: false,
        error: message,
      });
      return { ...ref, ok: false, error: message, latencyMs };
    }
  }

  /** Probes the cheapest model of every provider. */
  function probeAll(userId: string): Promise<ProbeResult[]> {
    return Promise.all(PROBE_TARGETS.map((ref) => probe(ref, userId)));
  }

  return { generateText, generateObject, probe, probeAll };
}

export type Gateway = ReturnType<typeof createGateway>;
