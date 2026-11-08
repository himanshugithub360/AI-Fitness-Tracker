import { MockLanguageModelV4 } from "ai/test";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { AiRateLimitError, AiUnavailableError, MissingKeyError } from "./errors";
import { createGateway } from "./gateway";
import type { ModelResolver } from "./providers";
import type { AiTask, ModelRef, UsageRow, UsageStore } from "./types";

const A: ModelRef = { provider: "mistral", model: "model-a" };
const B: ModelRef = { provider: "gemini", model: "model-b" };

const tasks: AiTask[] = ["chat", "plan", "food-vision", "food-verify", "insight-report", "quick"];
const routes = Object.fromEntries(tasks.map((t) => [t, [A, B]])) as Record<AiTask, ModelRef[]>;

function reply(text: string, input = 10, output = 5) {
  return new MockLanguageModelV4({
    doGenerate: async () => ({
      content: [{ type: "text", text }],
      finishReason: { unified: "stop", raw: undefined },
      usage: {
        inputTokens: { total: input, noCache: input, cacheRead: undefined, cacheWrite: undefined },
        outputTokens: { total: output, text: output, reasoning: undefined },
      },
      warnings: [],
    }),
  });
}

function failing(message: string) {
  return new MockLanguageModelV4({
    doGenerate: async () => {
      throw new Error(message);
    },
  });
}

/** A resolver that hands out a prepared model per model name. */
function resolverFor(models: Record<string, MockLanguageModelV4 | Error>): ModelResolver {
  return (ref) => {
    const found = models[ref.model];
    if (!found) throw new Error(`no model prepared for ${ref.model}`);
    if (found instanceof Error) throw found;
    return found;
  };
}

function fakeStore(used = 0) {
  const rows: UsageRow[] = [];
  const store: UsageStore = {
    countSuccessesSince: vi.fn(async () => used),
    record: vi.fn(async (row) => {
      rows.push(row);
    }),
  };
  return { store, rows };
}

const baseOptions = { task: "chat" as const, userId: "user-1", input: { prompt: "hello" } };

describe("gateway.generateText", () => {
  it("answers from the first model on the route and logs the call", async () => {
    const { store, rows } = fakeStore();
    const gateway = createGateway({
      routes,
      usage: store,
      resolveModel: resolverFor({ "model-a": reply("from a", 12, 7), "model-b": reply("from b") }),
    });

    const result = await gateway.generateText(baseOptions);

    expect(result.data).toBe("from a");
    expect(result.provider).toBe("mistral");
    expect(result.fallbackUsed).toBe(false);
    expect(result.usage).toEqual({ inputTokens: 12, outputTokens: 7 });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      userId: "user-1",
      task: "chat",
      provider: "mistral",
      model: "model-a",
      inputTokens: 12,
      outputTokens: 7,
      success: true,
    });
  });

  it("falls back to the next model when the first one fails", async () => {
    const { store, rows } = fakeStore();
    const gateway = createGateway({
      routes,
      usage: store,
      resolveModel: resolverFor({
        "model-a": failing("503 overloaded"),
        "model-b": reply("from b"),
      }),
    });

    const result = await gateway.generateText(baseOptions);

    expect(result.data).toBe("from b");
    expect(result.provider).toBe("gemini");
    expect(result.fallbackUsed).toBe(true);
    expect(result.attempts.map((a) => a.ok)).toEqual([false, true]);
    expect(rows.map((r) => r.success)).toEqual([false, true]);
    expect(rows[0]?.error).toContain("503 overloaded");
  });

  it("treats a missing API key as a failed attempt and falls back", async () => {
    const { store } = fakeStore();
    const gateway = createGateway({
      routes,
      usage: store,
      resolveModel: resolverFor({
        "model-a": new MissingKeyError("MISTRAL_API_KEY"),
        "model-b": reply("from b"),
      }),
    });

    const result = await gateway.generateText(baseOptions);

    expect(result.data).toBe("from b");
    expect(result.attempts[0]?.error).toContain("MISTRAL_API_KEY");
  });

  it("throws AiUnavailableError listing every attempt when all models fail", async () => {
    const { store, rows } = fakeStore();
    const gateway = createGateway({
      routes,
      usage: store,
      resolveModel: resolverFor({ "model-a": failing("a down"), "model-b": failing("b down") }),
    });

    const error = await gateway.generateText(baseOptions).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(AiUnavailableError);
    const unavailable = error as AiUnavailableError;
    expect(unavailable.attempts).toHaveLength(2);
    expect(unavailable.message).toContain("a down");
    expect(unavailable.message).toContain("b down");
    expect(rows.every((r) => !r.success)).toBe(true);
  });

  it("blocks a user who reached the daily limit without calling any model", async () => {
    const { store } = fakeStore(5);
    const resolveModel = vi.fn(resolverFor({ "model-a": reply("x"), "model-b": reply("y") }));
    const gateway = createGateway({ routes, usage: store, resolveModel, dailyLimit: 5 });

    await expect(gateway.generateText(baseOptions)).rejects.toBeInstanceOf(AiRateLimitError);
    expect(resolveModel).not.toHaveBeenCalled();
  });

  it("allows a user just under the limit", async () => {
    const { store } = fakeStore(4);
    const gateway = createGateway({
      routes,
      usage: store,
      resolveModel: resolverFor({ "model-a": reply("ok"), "model-b": reply("y") }),
      dailyLimit: 5,
    });

    await expect(gateway.generateText(baseOptions)).resolves.toMatchObject({ data: "ok" });
  });

  it("lets the call through when usage cannot be read and failOpen is on", async () => {
    const store: UsageStore = {
      countSuccessesSince: async () => {
        throw new Error("table missing");
      },
      record: async () => {},
    };
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const gateway = createGateway({
      routes,
      usage: store,
      failOpen: true,
      resolveModel: resolverFor({ "model-a": reply("ok"), "model-b": reply("y") }),
    });

    await expect(gateway.generateText(baseOptions)).resolves.toMatchObject({ data: "ok" });
  });

  it("blocks the call when usage cannot be read and failOpen is off", async () => {
    const store: UsageStore = {
      countSuccessesSince: async () => {
        throw new Error("table missing");
      },
      record: async () => {},
    };
    const gateway = createGateway({
      routes,
      usage: store,
      failOpen: false,
      resolveModel: resolverFor({ "model-a": reply("ok"), "model-b": reply("y") }),
    });

    await expect(gateway.generateText(baseOptions)).rejects.toThrow("table missing");
  });

  it("still answers when logging the usage fails", async () => {
    const store: UsageStore = {
      countSuccessesSince: async () => 0,
      record: async () => {
        throw new Error("db down");
      },
    };
    vi.spyOn(console, "error").mockImplementation(() => {});
    const gateway = createGateway({
      routes,
      usage: store,
      resolveModel: resolverFor({ "model-a": reply("ok"), "model-b": reply("y") }),
    });

    await expect(gateway.generateText(baseOptions)).resolves.toMatchObject({ data: "ok" });
  });

  it("uses a route override instead of the task route", async () => {
    const { store } = fakeStore();
    const gateway = createGateway({
      routes,
      usage: store,
      resolveModel: resolverFor({ "model-a": reply("from a"), "model-b": reply("from b") }),
    });

    const result = await gateway.generateText({ ...baseOptions, route: [B] });

    expect(result.data).toBe("from b");
    expect(result.attempts).toHaveLength(1);
  });
});

describe("gateway.generateObject", () => {
  const schema = z.object({ calories: z.number(), name: z.string() });

  it("returns an object that matches the schema", async () => {
    const { store } = fakeStore();
    const gateway = createGateway({
      routes,
      usage: store,
      resolveModel: resolverFor({
        "model-a": reply('{"calories":535,"name":"Dal and rice"}'),
        "model-b": reply("unused"),
      }),
    });

    const result = await gateway.generateObject({ ...baseOptions, schema });

    expect(result.data).toEqual({ calories: 535, name: "Dal and rice" });
  });

  it("falls back when the first model returns something that does not match the schema", async () => {
    const { store, rows } = fakeStore();
    const gateway = createGateway({
      routes,
      usage: store,
      resolveModel: resolverFor({
        "model-a": reply('{"calories":"lots"}'),
        "model-b": reply('{"calories":300,"name":"Salad"}'),
      }),
    });

    const result = await gateway.generateObject({ ...baseOptions, schema });

    expect(result.data).toEqual({ calories: 300, name: "Salad" });
    expect(result.fallbackUsed).toBe(true);
    expect(rows.map((r) => r.success)).toEqual([false, true]);
  });
});

describe("gateway.probe", () => {
  it("reports a working model", async () => {
    const { store, rows } = fakeStore();
    const gateway = createGateway({
      routes,
      usage: store,
      resolveModel: resolverFor({ "model-a": reply("ready") }),
    });

    const result = await gateway.probe(A, "user-1");

    expect(result).toMatchObject({ ok: true, text: "ready", provider: "mistral" });
    expect(rows[0]).toMatchObject({ task: "probe", success: true });
  });

  it("reports a failing model without throwing", async () => {
    const { store } = fakeStore();
    const gateway = createGateway({
      routes,
      usage: store,
      resolveModel: resolverFor({ "model-a": failing("401 bad key") }),
    });

    const result = await gateway.probe(A, "user-1");

    expect(result.ok).toBe(false);
    expect(result.error).toContain("401 bad key");
  });
});
