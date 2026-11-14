import { describe, expect, it } from "vitest";
import { VOICE_PROBLEM } from "./problems";
import { readVoiceSession } from "./session";

describe("readVoiceSession", () => {
  it("accepts a server without voice", () => {
    expect(readVoiceSession(true, { configured: false })).toEqual({ ok: true, session: { configured: false } });
  });

  it("accepts a token with its dynamic variables", () => {
    const session = { configured: true, conversationToken: "token", dynamicVariables: { opening_line: "Hello." } };
    expect(readVoiceSession(true, session)).toEqual({ ok: true, session });
  });

  it("passes on the server's own sentence when the request failed", () => {
    const body = { error: "Too many voice calls were started.", code: "rate_limited" };
    expect(readVoiceSession(false, body)).toEqual({ ok: false, error: body.error });
  });

  it.each([
    ["a token is missing", true, { configured: true, dynamicVariables: {} }],
    ["a variable is not text", true, { configured: true, conversationToken: "token", dynamicVariables: { a: 1 } }],
    ["the body is not JSON", true, null],
    ["an error has no sentence", false, "<html>502</html>"],
  ])("falls back to a plain sentence when %s", (_name, ok, body) => {
    expect(readVoiceSession(ok, body)).toEqual({ ok: false, error: VOICE_PROBLEM.couldNotConnect });
  });
});
