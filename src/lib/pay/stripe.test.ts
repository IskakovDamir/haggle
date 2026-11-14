import Stripe from "stripe";
import { afterEach, describe, expect, it, vi } from "vitest";
import { checkStripeKey, stripeClient, stripeProblem } from "./stripe";

// Placeholders, not real keys. Only the prefix matters to the guard.
const TEST_KEY = "sk_test_placeholder";
const LIVE_KEY = "sk_live_placeholder";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("checkStripeKey", () => {
  it("accepts secret and restricted test keys", () => {
    expect(checkStripeKey(TEST_KEY)).toEqual({ ok: true, key: TEST_KEY });
    expect(checkStripeKey("rk_test_placeholder")).toEqual({ ok: true, key: "rk_test_placeholder" });
    expect(checkStripeKey(`  ${TEST_KEY}\n`)).toEqual({ ok: true, key: TEST_KEY });
  });

  it("reports a missing key", () => {
    for (const key of [undefined, "", "   "]) {
      expect(checkStripeKey(key)).toMatchObject({ ok: false, reason: "missing" });
    }
  });

  it("refuses live keys, secret or restricted", () => {
    for (const key of [LIVE_KEY, "rk_live_placeholder", "sk_live", ` ${LIVE_KEY}`]) {
      const check = checkStripeKey(key);
      expect(check).toMatchObject({ ok: false, reason: "live" });
      expect(check.ok ? "" : check.message).toMatch(/live Stripe key/);
    }
  });

  it("refuses anything that is not clearly a test key", () => {
    for (const key of ["pk_test_placeholder", "sk_placeholder", "whsec_placeholder", "SK_TEST_placeholder"]) {
      expect(checkStripeKey(key)).toMatchObject({ ok: false, reason: "unrecognized" });
    }
  });

  it("never repeats the key in its message", () => {
    const check = checkStripeKey(LIVE_KEY);
    expect(check.ok ? LIVE_KEY : check.message).not.toContain(LIVE_KEY);
  });
});

describe("stripeClient", () => {
  it("gives no client without a key", () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "");
    expect(stripeClient()).toMatchObject({ ok: false });
  });

  it("gives no client for a live key", () => {
    vi.stubEnv("STRIPE_SECRET_KEY", LIVE_KEY);
    const access = stripeClient();
    expect(access.ok).toBe(false);
    expect(access.ok ? "" : access.message).toMatch(/test mode/);
  });

  it("creates one client per key and reuses it", () => {
    vi.stubEnv("STRIPE_SECRET_KEY", TEST_KEY);
    const first = stripeClient();
    const second = stripeClient();
    expect(first.ok && second.ok && first.stripe === second.stripe).toBe(true);

    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_another_placeholder");
    const third = stripeClient();
    expect(first.ok && third.ok && first.stripe !== third.stripe).toBe(true);
  });
});

describe("stripeProblem", () => {
  const { StripeAuthenticationError, StripeInvalidRequestError, StripeRateLimitError, StripeConnectionError } = Stripe.errors;
  const fallback = "It did not work. Please try again.";

  it("treats a rejected key as not configured", () => {
    const error = new StripeAuthenticationError({ message: "Invalid API Key provided" });
    expect(stripeProblem(error, fallback).code).toBe("not_configured");
  });

  it("treats an unknown session as a bad request", () => {
    const error = new StripeInvalidRequestError({ message: "No such checkout.session", code: "resource_missing" });
    expect(stripeProblem(error, fallback)).toEqual({
      code: "bad_request",
      message: "We could not find that checkout session.",
    });
  });

  it("passes Stripe's rate limit through", () => {
    const error = new StripeRateLimitError({ message: "Too many requests" });
    expect(stripeProblem(error, fallback).code).toBe("rate_limited");
  });

  it("reports everything else as a failure in the caller's words, never Stripe's raw text", () => {
    for (const error of [new StripeConnectionError({ message: "socket hang up" }), new Error("boom"), "boom"]) {
      expect(stripeProblem(error, fallback)).toEqual({ code: "failed", message: fallback });
    }
  });
});
