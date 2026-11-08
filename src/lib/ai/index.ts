import "server-only";
import { createGateway, type Gateway } from "./gateway";
import { createModelResolver } from "./providers";
import { createSupabaseUsageStore } from "./usage-store";

export { AiRateLimitError, AiUnavailableError, MissingKeyError } from "./errors";
export { MODELS, TASK_ROUTES } from "./models";
export type { AiResult, AiTask, ModelRef, ProviderId } from "./types";
export type { AiCallOptions, Gateway, ProbeResult } from "./gateway";

let instance: Gateway | undefined;

/**
 * The one place the app talks to Mistral and Gemini. Server code only.
 * Every call is routed by task, falls back to the other provider on failure,
 * is capped per user, and is logged in the ai_usage table.
 */
export function getGateway(): Gateway {
  instance ??= createGateway({
    resolveModel: createModelResolver(),
    usage: createSupabaseUsageStore(),
    dailyLimit: Number(process.env.AI_DAILY_LIMIT) || 100,
  });
  return instance;
}
