// The route as deployed, with no key on the server. Nothing here can reach the network: the opening
// line needs no model, and without a key the model wrapper stops before it builds a client.
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildBrief, openingLine } from "@/lib/negotiator";
import { lever, mariaChase, post, transcript } from "@/lib/negotiator/test-support";
import { POST } from "./route";

const brief = buildBrief({ card: mariaChase, holderFirstName: "Maria", lever: lever("apr_reduction", "chase") });

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("POST /api/negotiate", () => {
  it("opens the call with the fixed opening line, even without a key", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    const response = await POST(post("/api/negotiate", { brief, turns: [] }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ reply: openingLine(brief), done: false });
  });

  it("answers not_configured for the next turn when the server has no key", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    const turns = transcript(["agent", openingLine(brief)], ["bank", "How can I help?"]);
    const response = await POST(post("/api/negotiate", { brief, turns }));
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ code: "not_configured" });
  });
});
