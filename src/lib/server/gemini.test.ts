import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { askGeminiJson, GeminiError } from "./gemini";
import { aiProvider, capabilities } from "./http";

const schema = { type: "object", properties: { reply: { type: "string" } }, required: ["reply"] };

function fakeFetch(status: number, body: unknown) {
  const calls: { url: string; init: RequestInit }[] = [];
  const impl = (async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    return new Response(typeof body === "string" ? body : JSON.stringify(body), { status });
  }) as unknown as typeof fetch;
  return { impl, calls };
}

const reply = (text: string, finishReason = "STOP") => ({ candidates: [{ content: { parts: [{ text }] }, finishReason }] });

async function codeOf(promise: Promise<unknown>): Promise<string> {
  const error = await promise.catch((thrown: unknown) => thrown);
  return error instanceof GeminiError ? error.code : "no error";
}

describe("askGeminiJson", () => {
  beforeEach(() => vi.stubEnv("GEMINI_API_KEY", "test-key"));
  afterEach(() => vi.unstubAllEnvs());

  test("sends the schema, the key in a header and the file inline, and parses the JSON reply", async () => {
    const { impl, calls } = fakeFetch(200, reply('{"reply":"hi"}'));
    const result = await askGeminiJson({
      system: "be brief",
      user: "hello",
      schema,
      maxTokens: 100,
      thinkingLevel: "minimal",
      file: { mediaType: "application/pdf", bytes: new Uint8Array([1, 2, 3]) },
      fetchImpl: impl,
    });
    expect(result).toEqual({ reply: "hi" });
    const { url, init } = calls[0];
    expect(url).toContain(":generateContent");
    expect(url).not.toContain("test-key");
    expect((init.headers as Record<string, string>)["x-goog-api-key"]).toBe("test-key");
    const body = JSON.parse(String(init.body));
    expect(body.generationConfig.responseJsonSchema).toEqual(schema);
    expect(body.generationConfig.thinkingConfig).toEqual({ thinkingLevel: "minimal" });
    expect(body.contents[0].parts[0].inlineData).toEqual({ mimeType: "application/pdf", data: "AQID" });
  });

  test("skips the model's thought parts", async () => {
    const { impl } = fakeFetch(200, {
      candidates: [{ content: { parts: [{ text: "thinking...", thought: true }, { text: '{"reply":"ok"}' }] }, finishReason: "STOP" }],
    });
    expect(await askGeminiJson({ system: "", user: "", schema, maxTokens: 10, fetchImpl: impl })).toEqual({ reply: "ok" });
  });

  test("maps failures to our codes", async () => {
    const ask = (status: number, body: unknown) =>
      askGeminiJson({ system: "", user: "", schema, maxTokens: 10, fetchImpl: fakeFetch(status, body).impl });
    expect(await codeOf(ask(403, "denied"))).toBe("not_configured");
    expect(await codeOf(ask(429, "slow down"))).toBe("rate_limited");
    expect(await codeOf(ask(400, "bad file"))).toBe("unreadable");
    expect(await codeOf(ask(500, "oops"))).toBe("failed");
    expect(await codeOf(ask(200, reply('{"reply":', "MAX_TOKENS")))).toBe("failed");
    expect(await codeOf(ask(200, reply("not json")))).toBe("failed");
    expect(await codeOf(ask(200, { promptFeedback: { blockReason: "SAFETY" } }))).toBe("failed");
  });

  test("without a key it is not configured and makes no request", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    const { impl, calls } = fakeFetch(200, reply("{}"));
    expect(await codeOf(askGeminiJson({ system: "", user: "", schema, maxTokens: 10, fetchImpl: impl }))).toBe("not_configured");
    expect(calls).toHaveLength(0);
  });
});

describe("aiProvider", () => {
  afterEach(() => vi.unstubAllEnvs());

  test("prefers Claude, falls back to Gemini, and honors AI_PROVIDER", () => {
    vi.stubEnv("AI_PROVIDER", "");
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    vi.stubEnv("GEMINI_API_KEY", "");
    expect(aiProvider()).toBeNull();
    expect(capabilities().reading).toBe(false);

    vi.stubEnv("GEMINI_API_KEY", "g");
    expect(aiProvider()).toBe("gemini");
    expect(capabilities().negotiation).toBe(true);

    vi.stubEnv("ANTHROPIC_API_KEY", "a");
    expect(aiProvider()).toBe("claude");

    vi.stubEnv("AI_PROVIDER", "gemini");
    expect(aiProvider()).toBe("gemini");
  });
});
