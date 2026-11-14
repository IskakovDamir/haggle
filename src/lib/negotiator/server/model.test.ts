// The Claude wrapper without Claude: reply parsing and error mapping. Nothing here opens a connection.
import Anthropic from "@anthropic-ai/sdk";
import { afterEach, describe, expect, it, vi } from "vitest";
import { askClaude, fromProviderError, ModelError, modelProblem, readJsonReply } from "./model";

type Reply = Parameters<typeof readJsonReply>[0];

const text = (value: string) => ({ type: "text", text: value, citations: null }) as Reply["content"][number];
const reply = (stop_reason: Reply["stop_reason"], ...parts: string[]): Reply => ({ stop_reason, content: parts.map(text) });

const PROVIDER_TEXT = "raw provider detail that must stay on the server";
const errorBody = { type: "error" };
const rejectedKey = () => new Anthropic.AuthenticationError(401, errorBody, PROVIDER_TEXT, new Headers());
const forbidden = () => new Anthropic.PermissionDeniedError(403, errorBody, PROVIDER_TEXT, new Headers());
const busy = () => new Anthropic.RateLimitError(429, errorBody, PROVIDER_TEXT, new Headers());
const badRequest = () => new Anthropic.BadRequestError(400, errorBody, PROVIDER_TEXT, new Headers());
const serverError = () => new Anthropic.InternalServerError(500, errorBody, PROVIDER_TEXT, new Headers());

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("readJsonReply", () => {
  it("parses the JSON of a finished reply", () => {
    expect(readJsonReply(reply("end_turn", '{"reply":"Thank you.","done":false}'))).toEqual({ reply: "Thank you.", done: false });
  });

  it("joins text blocks before parsing", () => {
    expect(readJsonReply(reply("end_turn", '{"reply":"Thank', ' you.","done":true}'))).toEqual({ reply: "Thank you.", done: true });
  });

  it.each(["refusal", "max_tokens", "tool_use", "pause_turn"] as const)("treats stop_reason %s as a failed call", (stopReason) => {
    expect(() => readJsonReply(reply(stopReason, '{"reply":"x","done":false}'))).toThrowError(ModelError);
  });

  it("fails on a reply that is not JSON", () => {
    expect(() => readJsonReply(reply("end_turn", "Sure, here you go"))).toThrowError(ModelError);
    expect(() => readJsonReply(reply("end_turn"))).toThrowError(ModelError);
  });
});

describe("fromProviderError", () => {
  it("maps a rejected key to not_configured", () => {
    expect(fromProviderError(rejectedKey()).code).toBe("not_configured");
    expect(fromProviderError(forbidden()).code).toBe("not_configured");
  });

  it("maps a provider rate limit to rate_limited", () => {
    expect(fromProviderError(busy()).code).toBe("rate_limited");
  });

  it("maps every other failure to failed", () => {
    expect(fromProviderError(serverError()).code).toBe("failed");
    expect(fromProviderError(badRequest()).code).toBe("failed");
    expect(fromProviderError(new Anthropic.APIConnectionError({ message: PROVIDER_TEXT })).code).toBe("failed");
    expect(fromProviderError(new TypeError(PROVIDER_TEXT)).code).toBe("failed");
    expect(fromProviderError("boom").code).toBe("failed");
  });

  it("passes our own errors through unchanged", () => {
    const ours = new ModelError("rate_limited", "Busy.");
    expect(fromProviderError(ours)).toBe(ours);
  });

  it("never carries the provider's wording", () => {
    const errors = [rejectedKey(), busy(), serverError(), new Error(PROVIDER_TEXT)];
    for (const error of errors) expect(fromProviderError(error).message).not.toContain(PROVIDER_TEXT);
  });
});

describe("modelProblem", () => {
  it("answers with our code and sentence, and keeps the provider's text in the server log", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const response = modelProblem("negotiate", busy());
    expect(response.status).toBe(429);
    const sent = await response.json();
    expect(sent.code).toBe("rate_limited");
    expect(JSON.stringify(sent)).not.toContain(PROVIDER_TEXT);
    expect(log).toHaveBeenCalledOnce();
  });

  it("does not log a missing key as a failure", () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const response = modelProblem("negotiate", new ModelError("not_configured", "No key."));
    expect(response.status).toBe(503);
    expect(log).not.toHaveBeenCalled();
  });
});

describe("askClaude", () => {
  it("answers not_configured without a key, before any request is made", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    const request = { system: "s", user: "u", schema: { type: "object" }, maxTokens: 100 };
    await expect(askClaude(request)).rejects.toMatchObject({ name: "ModelError", code: "not_configured" });
  });
});
