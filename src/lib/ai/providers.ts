import { createGoogle } from "@ai-sdk/google";
import { createMistral } from "@ai-sdk/mistral";
import type { LanguageModel } from "ai";
import { MissingKeyError } from "./errors";
import type { ModelRef } from "./types";

export type ModelResolver = (ref: ModelRef) => LanguageModel;

/**
 * Builds the function that turns a ModelRef into a callable model.
 * Provider clients are created on first use, so a missing key only affects
 * the provider that needs it.
 */
export function createModelResolver(
  env: Record<string, string | undefined> = process.env,
): ModelResolver {
  let mistral: ReturnType<typeof createMistral> | undefined;
  let google: ReturnType<typeof createGoogle> | undefined;

  return (ref) => {
    if (ref.provider === "mistral") {
      const apiKey = env.MISTRAL_API_KEY;
      if (!apiKey) throw new MissingKeyError("MISTRAL_API_KEY");
      mistral ??= createMistral({ apiKey });
      return mistral(ref.model);
    }

    const apiKey = env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) throw new MissingKeyError("GOOGLE_GENERATIVE_AI_API_KEY");
    google ??= createGoogle({ apiKey });
    return google(ref.model);
  };
}
