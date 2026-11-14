// Stripe access for the server. Test mode only: this build must never take real money.
import Stripe from "stripe";
import type { ProblemCode } from "@/lib/server/http";

/** Secret and restricted keys from Stripe's test mode. Nothing else is accepted. */
const TEST_KEY_PREFIXES = ["sk_test_", "rk_test_"];
const LIVE_KEY_PREFIXES = ["sk_live", "rk_live"];

export type StripeKeyCheck =
  | { ok: true; key: string }
  | { ok: false; reason: "missing" | "live" | "unrecognized"; message: string };

/**
 * Decide whether a Stripe key may be used. A live key is refused outright, and so is anything
 * that is not clearly a test key, so a typo can never turn into a real charge.
 */
export function checkStripeKey(rawKey: string | undefined): StripeKeyCheck {
  const key = rawKey?.trim() ?? "";
  if (!key) {
    return { ok: false, reason: "missing", message: "Payments are not set up on this server yet." };
  }
  if (LIVE_KEY_PREFIXES.some((prefix) => key.startsWith(prefix))) {
    return {
      ok: false,
      reason: "live",
      message: "This server has a live Stripe key. Haggle only runs in Stripe test mode, so payments are switched off.",
    };
  }
  if (!TEST_KEY_PREFIXES.some((prefix) => key.startsWith(prefix))) {
    return {
      ok: false,
      reason: "unrecognized",
      message: "The Stripe key on this server is not a test key (sk_test_...), so payments are switched off.",
    };
  }
  return { ok: true, key };
}

export type StripeAccess = { ok: true; stripe: Stripe } | { ok: false; message: string };

let cached: { key: string; stripe: Stripe } | null = null;

/**
 * The Stripe client, created on first use so that importing this file never needs the key
 * (the build has none). Returns the reason instead of a client when the key is missing or refused.
 */
export function stripeClient(): StripeAccess {
  const check = checkStripeKey(process.env.STRIPE_SECRET_KEY);
  if (!check.ok) return { ok: false, message: check.message };
  if (cached?.key !== check.key) {
    cached = {
      key: check.key,
      stripe: new Stripe(check.key, { maxNetworkRetries: 1, timeout: 15_000, appInfo: { name: "haggle" } }),
    };
  }
  return { ok: true, stripe: cached.stripe };
}

/**
 * Turn anything thrown around a Stripe call into a problem the page can show. Never echoes Stripe's raw
 * text. `fallback` is the caller's own sentence for a failure with no better explanation, because only
 * the caller knows what is safe to promise ("nothing was charged" is true for a new session, not for a lookup).
 */
export function stripeProblem(error: unknown, fallback: string): { code: ProblemCode; message: string } {
  if (error instanceof Stripe.errors.StripeAuthenticationError || error instanceof Stripe.errors.StripePermissionError) {
    return { code: "not_configured", message: "Stripe did not accept this server's key, so payments are switched off." };
  }
  if (error instanceof Stripe.errors.StripeRateLimitError) {
    return { code: "rate_limited", message: "Stripe is busy right now. Wait a moment and try again." };
  }
  if (error instanceof Stripe.errors.StripeError && error.code === "resource_missing") {
    return { code: "bad_request", message: "We could not find that checkout session." };
  }
  return { code: "failed", message: fallback };
}
