import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mariaBrief as briefFor } from "../test-support";
import { ElevenLabsError } from "./elevenlabs";
import { handlePhoneStatus, handleStartPhoneCall } from "./phone";

const mariaBrief = briefFor();

const ENV = {
  ELEVENLABS_API_KEY: "key",
  ELEVENLABS_AGENT_ID: "agent_1",
  ELEVENLABS_PHONE_NUMBER_ID: "phnum_1",
  PHONE_ALLOWED_NUMBERS: "+15552345678",
};

let ip = 0;
const post = (body: unknown) =>
  new Request("http://localhost/api/voice/phone", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": `10.0.0.${++ip}` },
    body: JSON.stringify(body),
  });
const get = () => new Request("http://localhost/api/voice/phone/x", { headers: { "x-forwarded-for": `10.0.1.${++ip}` } });

beforeEach(() => {
  for (const [name, value] of Object.entries(ENV)) vi.stubEnv(name, value);
});
afterEach(() => vi.unstubAllEnvs());

describe("POST /api/voice/phone", () => {
  it("is switched off without the allow list", async () => {
    vi.stubEnv("PHONE_ALLOWED_NUMBERS", "");
    const response = await handleStartPhoneCall(post({ brief: mariaBrief, toNumber: "+15552345678" }));
    expect(response.status).toBe(503);
  });

  it("rings only approved numbers", async () => {
    const dial = vi.fn();
    const response = await handleStartPhoneCall(post({ brief: mariaBrief, toNumber: "(555) 999-0000" }), dial);
    expect(response.status).toBe(400);
    expect(dial).not.toHaveBeenCalled();
  });

  it("rings an approved number with the call instructions and a known voice only", async () => {
    const dial = vi.fn().mockResolvedValue({ conversationId: "conv_123456" });
    const response = await handleStartPhoneCall(
      post({ brief: mariaBrief, toNumber: "(555) 234-5678", voiceId: "not-a-voice" }),
      dial,
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ conversationId: "conv_123456" });
    const [, input] = dial.mock.calls[0];
    expect(input).toMatchObject({ agentId: "agent_1", phoneNumberId: "phnum_1", toNumber: "+15552345678", voiceId: undefined });
    expect(Object.keys(input.dynamicVariables)).toEqual(expect.arrayContaining(["call_instructions", "opening_line"]));
  });

  it("refuses a bad brief", async () => {
    const response = await handleStartPhoneCall(post({ brief: { goal: "x" }, toNumber: "+15552345678" }), vi.fn());
    expect(response.status).toBe(400);
  });

  it("reports a refused setup as not configured", async () => {
    const dial = vi.fn().mockRejectedValue(new ElevenLabsError(401, "bad key"));
    const response = await handleStartPhoneCall(post({ brief: mariaBrief, toNumber: "+15552345678" }), dial);
    expect(response.status).toBe(503);
  });
});

describe("GET /api/voice/phone/{id}", () => {
  it("reads the call and keeps calls from other agents out", async () => {
    const mine = vi.fn().mockResolvedValue({
      agent_id: "agent_1",
      status: "in-progress",
      transcript: [{ role: "user", message: "Card services, how can I help?", time_in_call_secs: 2 }],
    });
    const ok = await handlePhoneStatus(get(), "conv_123456", mine);
    expect(await ok.json()).toEqual({
      status: "live",
      reason: null,
      turns: [{ role: "bank", text: "Card services, how can I help?", at: 2000 }],
    });

    const theirs = vi.fn().mockResolvedValue({ agent_id: "someone_else", status: "done" });
    expect((await handlePhoneStatus(get(), "conv_123456", theirs)).status).toBe(400);
  });

  it("treats a record that is not there yet as ringing, and refuses odd ids", async () => {
    const missing = vi.fn().mockRejectedValue(new ElevenLabsError(404, "not found"));
    expect(await (await handlePhoneStatus(get(), "conv_123456", missing)).json()).toMatchObject({ status: "dialing" });
    expect((await handlePhoneStatus(get(), "../etc", missing)).status).toBe(400);
  });
});
