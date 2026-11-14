// The checkout routes up to the point where they would call Stripe. Nothing here touches the network:
// every request is turned away first (no key, a live key, or a bad input).
import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";
import { GET } from "./verify/route";

const TEST_KEY = "sk_test_placeholder";
const LIVE_KEY = "sk_live_placeholder";

const validBody = { callId: "call-1", annualSavingsCents: 60900, label: "Chase APR reduction" };

function postCheckout(body: unknown): Promise<Response> {
  return POST(
    new Request("http://localhost:3000/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

function getVerify(query: string): Promise<Response> {
  return GET(new Request(`http://localhost:3000/api/checkout/verify${query}`));
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("POST /api/checkout", () => {
  it("answers not_configured without a key", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "");
    const response = await postCheckout(validBody);
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ code: "not_configured" });
  });

  it("refuses to run on a live key", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", LIVE_KEY);
    const response = await postCheckout(validBody);
    expect(response.status).toBe(503);
    const body = await response.json();
    expect(body.code).toBe("not_configured");
    expect(body.error).toMatch(/live Stripe key/);
    expect(body.error).not.toContain(LIVE_KEY);
  });

  it("rejects a bad body before calling Stripe", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", TEST_KEY);
    const response = await postCheckout({ ...validBody, annualSavingsCents: -5 });
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ code: "bad_request" });
  });

  it("rejects a body that is not JSON", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", TEST_KEY);
    const response = await POST(new Request("http://localhost:3000/api/checkout", { method: "POST", body: "nope" }));
    expect(response.status).toBe(400);
  });
});

describe("GET /api/checkout/verify", () => {
  it("answers not_configured without a key", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "");
    const response = await getVerify("?session_id=cs_test_abc123");
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ code: "not_configured" });
  });

  it.each([["missing", ""], ["live", "?session_id=cs_live_abc123"], ["unfilled", "?session_id={CHECKOUT_SESSION_ID}"]])(
    "rejects a %s session id before calling Stripe",
    async (_case, query) => {
      vi.stubEnv("STRIPE_SECRET_KEY", TEST_KEY);
      const response = await getVerify(query);
      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({ code: "bad_request" });
    },
  );
});
