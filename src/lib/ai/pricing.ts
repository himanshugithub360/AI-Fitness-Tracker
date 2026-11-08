/**
 * Price per one million tokens, in US dollars, keyed by model name.
 *
 * Left empty on purpose: provider prices change, and a wrong number would make the
 * usage log misleading. Fill in the models you use from each provider's pricing page,
 * for example:
 *   "gemini-2.5-flash": { input: 0.3, output: 2.5 },
 *
 * Models that are not listed are logged with a cost of 0. Token counts are always exact.
 */
export const PRICING_PER_MILLION: Record<string, { input: number; output: number }> = {};

export function estimateCostUsd(model: string, inputTokens: number, outputTokens: number): number {
  const price = PRICING_PER_MILLION[model];
  if (!price) return 0;
  return (inputTokens * price.input + outputTokens * price.output) / 1_000_000;
}
