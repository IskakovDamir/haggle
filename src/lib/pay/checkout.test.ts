import { describe, expect, it } from "vitest";
import {
  MAX_ANNUAL_SAVINGS_CENTS,
  MIN_CHARGE_CENTS,
  chargeForWin,
  checkoutSessionParams,
  isTestSessionId,
  parseCheckoutBody,
  paymentStatus,
  returnUrls,
  siteOrigin,
} from "./checkout";

// A stand-in for the engine's feeForWin (20%, half up), so these tests do not depend on the engine.
const twentyPercent = (savingsCents: number) => Math.round(savingsCents * 0.2);

const validBody = { callId: "3f0c1a52-8f5e-4c53-9d0b-1c2f6a7e9b10", annualSavingsCents: 60900, label: "Chase APR reduction" };

describe("chargeForWin", () => {
  it("charges the fee the fee rule returns", () => {
    expect(chargeForWin(60900, twentyPercent)).toBe(12180);
    expect(chargeForWin(60900, () => 777)).toBe(777);
  });

  it("charges a fee of exactly 50 cents", () => {
    expect(chargeForWin(250, twentyPercent)).toBe(MIN_CHARGE_CENTS);
  });

  it("does not charge a fee under 50 cents", () => {
    expect(chargeForWin(245, twentyPercent)).toBe(0);
    expect(chargeForWin(1, twentyPercent)).toBe(0);
    expect(chargeForWin(0, twentyPercent)).toBe(0);
  });
});

describe("siteOrigin", () => {
  const requestUrl = "http://localhost:3000/api/checkout";

  it("uses the request origin when no site URL is set", () => {
    expect(siteOrigin(requestUrl, undefined)).toBe("http://localhost:3000");
    expect(siteOrigin(requestUrl, "  ")).toBe("http://localhost:3000");
  });

  it("prefers NEXT_PUBLIC_SITE_URL and drops its path and trailing slash", () => {
    expect(siteOrigin(requestUrl, "https://haggle.example.com/")).toBe("https://haggle.example.com");
    expect(siteOrigin(requestUrl, "https://haggle.example.com/some/path")).toBe("https://haggle.example.com");
  });

  it("falls back to the request origin when the site URL is not an http(s) URL", () => {
    expect(siteOrigin(requestUrl, "haggle.example.com")).toBe("http://localhost:3000");
    expect(siteOrigin(requestUrl, "javascript:alert(1)")).toBe("http://localhost:3000");
  });
});

describe("returnUrls", () => {
  it("returns to the win page, with Stripe's session placeholder left unescaped on success", () => {
    expect(returnUrls("https://haggle.example.com", "call-1")).toEqual({
      successUrl: "https://haggle.example.com/win?call=call-1&session_id={CHECKOUT_SESSION_ID}",
      cancelUrl: "https://haggle.example.com/win?call=call-1",
    });
  });
});

describe("parseCheckoutBody", () => {
  it("accepts a valid body and trims the label", () => {
    expect(parseCheckoutBody({ ...validBody, label: "  Chase APR reduction " })).toEqual({ ok: true, body: validBody });
  });

  it("accepts the fallback id format used when crypto.randomUUID is missing", () => {
    expect(parseCheckoutBody({ ...validBody, callId: "id-k3j9x0a1" }).ok).toBe(true);
  });

  it("drops fields it does not know, such as a fee sent by the browser", () => {
    const parsed = parseCheckoutBody({ ...validBody, feeCents: 1 });
    expect(parsed).toEqual({ ok: true, body: validBody });
  });

  it.each([
    ["missing", undefined],
    ["empty", ""],
    ["too long", "a".repeat(65)],
    ["with a slash", "call/1"],
    ["with a space", "call 1"],
    ["not a string", 42],
  ])("rejects a callId that is %s", (_case, callId) => {
    const parsed = parseCheckoutBody({ ...validBody, callId });
    expect(parsed.ok ? "" : parsed.message).toMatch(/^callId/);
  });

  it.each([
    ["zero", 0],
    ["negative", -100],
    ["fractional", 100.5],
    ["at the cap", MAX_ANNUAL_SAVINGS_CENTS],
    ["a string", "60900"],
    ["NaN", Number.NaN],
    ["missing", undefined],
  ])("rejects annualSavingsCents that is %s", (_case, annualSavingsCents) => {
    const parsed = parseCheckoutBody({ ...validBody, annualSavingsCents });
    expect(parsed.ok ? "" : parsed.message).toMatch(/^annualSavingsCents/);
  });

  it("accepts savings just under the cap", () => {
    expect(parseCheckoutBody({ ...validBody, annualSavingsCents: MAX_ANNUAL_SAVINGS_CENTS - 1 }).ok).toBe(true);
  });

  it.each([
    ["missing", undefined],
    ["blank", "   "],
    ["too long", "x".repeat(81)],
    ["not a string", 7],
  ])("rejects a label that is %s", (_case, label) => {
    const parsed = parseCheckoutBody({ ...validBody, label });
    expect(parsed.ok ? "" : parsed.message).toMatch(/^label/);
  });

  it.each([[null], ["text"], [[]], [{}]])("rejects a body of %j", (body) => {
    expect(parseCheckoutBody(body).ok).toBe(false);
  });
});

describe("checkoutSessionParams", () => {
  const params = checkoutSessionParams({ body: validBody, chargeCents: 12180, origin: "https://haggle.example.com" });

  it("asks for one payment in US dollars for the fee", () => {
    expect(params.mode).toBe("payment");
    expect(params.line_items).toHaveLength(1);
    const item = params.line_items?.[0];
    expect(item?.quantity).toBe(1);
    expect(item?.price_data?.currency).toBe("usd");
    expect(item?.price_data?.unit_amount).toBe(12180);
  });

  it("names the win and states what the fee is based on", () => {
    const product = params.line_items?.[0]?.price_data?.product_data;
    expect(product?.name).toBe("Haggle fee: Chase APR reduction");
    expect(product?.description).toBe("20% of $609.00 in first-year savings. Charged only after a win.");
  });

  it("carries the call id and the return links", () => {
    expect(params.metadata).toEqual({ callId: validBody.callId });
    expect(params.success_url).toBe(
      `https://haggle.example.com/win?call=${validBody.callId}&session_id={CHECKOUT_SESSION_ID}`,
    );
    expect(params.cancel_url).toBe(`https://haggle.example.com/win?call=${validBody.callId}`);
  });
});

describe("isTestSessionId", () => {
  it("accepts test session ids only", () => {
    expect(isTestSessionId("cs_test_a1B2c3D4")).toBe(true);
    expect(isTestSessionId("cs_live_a1B2c3D4")).toBe(false);
    expect(isTestSessionId("cs_test_")).toBe(false);
    expect(isTestSessionId("cs_test_abc/../x")).toBe(false);
    expect(isTestSessionId("{CHECKOUT_SESSION_ID}")).toBe(false);
    expect(isTestSessionId("")).toBe(false);
  });
});

describe("paymentStatus", () => {
  it("reports a paid session with its amount and call id", () => {
    const session = { payment_status: "paid", amount_total: 12180, metadata: { callId: "call-1" } };
    expect(paymentStatus(session)).toEqual({ paid: true, amountCents: 12180, callId: "call-1" });
  });

  it("reports an unpaid session as not paid", () => {
    const session = { payment_status: "unpaid", amount_total: 12180, metadata: { callId: "call-1" } };
    expect(paymentStatus(session).paid).toBe(false);
  });

  it("does not count 'no payment required' as paid", () => {
    expect(paymentStatus({ payment_status: "no_payment_required", amount_total: 0, metadata: null })).toEqual({
      paid: false,
      amountCents: 0,
      callId: null,
    });
  });
});
