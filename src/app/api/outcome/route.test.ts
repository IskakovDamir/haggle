// The route as deployed, with no key on the server. Nothing here can reach the network: without a
// key the model wrapper stops before it builds a client.
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildBrief, openingLine } from "@/lib/negotiator";
import { lever, mariaChase, post, transcript } from "@/lib/negotiator/test-support";
import { POST } from "./route";

const brief = buildBrief({ card: mariaChase, holderFirstName: "Maria", lever: lever("apr_reduction", "chase") });

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("POST /api/outcome", () => {
  it("answers not_configured when the server has no key", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    vi.stubEnv("GEMINI_API_KEY", "");
    const turns = transcript(["agent", openingLine(brief)], ["bank", "I can lower your APR to 19.99%."]);
    const response = await POST(post("/api/outcome", { brief, turns }));
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ code: "not_configured" });
  });

  it("rejects a body that is not a call", async () => {
    const response = await POST(post("/api/outcome", { brief }));
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ code: "bad_request" });
  });
});
