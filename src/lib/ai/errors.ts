import type { Attempt } from "./types";

export class AiRateLimitError extends Error {
  readonly limit: number;

  constructor(limit: number) {
    super(`Daily AI limit of ${limit} requests reached. Try again tomorrow.`);
    this.name = "AiRateLimitError";
    this.limit = limit;
  }
}

export class AiUnavailableError extends Error {
  readonly attempts: Attempt[];

  constructor(attempts: Attempt[]) {
    const detail = attempts
      .map((a) => `${a.provider}/${a.model}: ${a.error ?? "failed"}`)
      .join("; ");
    super(`Every AI provider failed. ${detail}`);
    this.name = "AiUnavailableError";
    this.attempts = attempts;
  }
}

export class MissingKeyError extends Error {
  readonly variable: string;

  constructor(variable: string) {
    super(`${variable} is not set. Add it to .env.local.`);
    this.name = "MissingKeyError";
    this.variable = variable;
  }
}
