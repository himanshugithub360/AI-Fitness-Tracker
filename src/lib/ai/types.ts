export type ProviderId = "mistral" | "gemini";

export type ModelRef = {
  provider: ProviderId;
  model: string;
};

/** What the app is asking the AI to do. Each task has its own model route. */
export type AiTask = "chat" | "plan" | "food-vision" | "food-verify" | "insight-report" | "quick";

export type Attempt = ModelRef & {
  ok: boolean;
  error?: string;
  latencyMs: number;
};

export type TokenUsage = {
  inputTokens: number;
  outputTokens: number;
};

export type AiResult<T> = {
  data: T;
  /** The model that actually answered. */
  provider: ProviderId;
  model: string;
  usage: TokenUsage;
  latencyMs: number;
  /** Every model tried, in order, including the ones that failed. */
  attempts: Attempt[];
  /** True when the first choice failed and a fallback answered. */
  fallbackUsed: boolean;
};

export type UsageRow = ModelRef & {
  userId: string;
  task: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  latencyMs: number;
  success: boolean;
  error?: string;
};

/** Where AI calls are counted and logged. The real one is backed by Supabase. */
export interface UsageStore {
  countSuccessesSince(userId: string, since: Date): Promise<number>;
  record(row: UsageRow): Promise<void>;
}
