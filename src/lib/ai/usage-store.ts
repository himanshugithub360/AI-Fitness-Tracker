import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { UsageRow, UsageStore } from "./types";

/** Counts and logs AI calls in the ai_usage table, using the service role. */
export function createSupabaseUsageStore(): UsageStore {
  return {
    async countSuccessesSince(userId, since) {
      const { count, error } = await createAdminClient()
        .from("ai_usage")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("success", true)
        .gte("created_at", since.toISOString());
      if (error) throw new Error(error.message);
      return count ?? 0;
    },

    async record(row: UsageRow) {
      const { error } = await createAdminClient()
        .from("ai_usage")
        .insert({
          user_id: row.userId,
          task: row.task,
          provider: row.provider,
          model: row.model,
          input_tokens: row.inputTokens,
          output_tokens: row.outputTokens,
          cost_usd: row.costUsd,
          latency_ms: row.latencyMs,
          success: row.success,
          error: row.error ?? null,
        });
      if (error) throw new Error(error.message);
    },
  };
}
