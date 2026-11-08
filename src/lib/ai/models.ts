import type { AiTask, ModelRef } from "./types";

/**
 * The models APEX uses. Override any of them with an environment variable (for example
 * AI_MODEL_GEMINI_PRO) without touching code.
 *
 * The defaults were chosen by testing against free-tier keys on 2026-11-08, so the app
 * works out of the box:
 * - Mistral: mistral-small-latest and mistral-medium-latest had a quota of 0, while the
 *   ministral models and mistral-large-4 worked.
 * - Gemini: every Pro model had a quota of 0, and the 2.5 models are closed to new
 *   accounts. gemini-3.5-flash answered in about 1.5 s through the AI SDK, while
 *   gemini-3.7-flash and newer (which "gemini-flash-latest" points to) timed out, so we
 *   pin gemini-3.5-flash for both Gemini roles. Pinned names do get retired eventually:
 *   if a call starts failing with "no longer available", set the variable below.
 *
 * On paid plans, upgrade with environment variables only:
 *   AI_MODEL_MISTRAL_SMALL=mistral-small-latest
 *   AI_MODEL_MISTRAL_MEDIUM=mistral-medium-latest
 *   AI_MODEL_GEMINI_PRO=gemini-pro-latest
 */
export const MODELS = {
  mistralLarge: {
    provider: "mistral",
    model: process.env.AI_MODEL_MISTRAL_LARGE ?? "mistral-large-4",
  },
  // Mid-size, with image input. Used for second opinions on food photos.
  mistralMedium: {
    provider: "mistral",
    model: process.env.AI_MODEL_MISTRAL_MEDIUM ?? "ministral-14b-latest",
  },
  // Small and cheap, for short jobs.
  mistralSmall: {
    provider: "mistral",
    model: process.env.AI_MODEL_MISTRAL_SMALL ?? "ministral-8b-latest",
  },
  geminiPro: {
    provider: "gemini",
    model: process.env.AI_MODEL_GEMINI_PRO ?? "gemini-3.5-flash",
  },
  geminiFlash: {
    provider: "gemini",
    model: process.env.AI_MODEL_GEMINI_FLASH ?? "gemini-3.5-flash",
  },
} as const satisfies Record<string, ModelRef>;

/**
 * Which model answers each task, in order. The first entry is tried first and the
 * rest are fallbacks. Every task has one Mistral and one Gemini model, so a single
 * provider outage never takes a feature down.
 */
export const TASK_ROUTES: Record<AiTask, ModelRef[]> = {
  // Conversation, tool use and structured replies.
  chat: [MODELS.mistralLarge, MODELS.geminiPro],
  // Weekly workout and meal plans as structured JSON.
  plan: [MODELS.mistralLarge, MODELS.geminiPro],
  // Reading a food photo. Gemini first, a Mistral vision model as backup.
  "food-vision": [MODELS.geminiFlash, MODELS.mistralMedium],
  // Second opinion on calories and macros from the first reading.
  "food-verify": [MODELS.mistralMedium, MODELS.geminiFlash],
  // Long-context weekly report over a month of logs.
  "insight-report": [MODELS.geminiPro, MODELS.mistralLarge],
  // Cheap, fast jobs: labels, tips, short rewrites.
  quick: [MODELS.mistralSmall, MODELS.geminiFlash],
};

/** The cheapest model of each provider, used for connectivity checks. */
export const PROBE_TARGETS: ModelRef[] = [MODELS.mistralSmall, MODELS.geminiFlash];
