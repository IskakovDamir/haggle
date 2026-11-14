// Pure helpers for "Pay after your win": what to charge, where Stripe sends the visitor back,
// and the shapes that go to and come from Stripe. No I/O here; the routes do the calls.
import type Stripe from "stripe";
import { z } from "zod";
import { WIN_FEE_BPS, feeForWin } from "@/lib/engine";
import { formatPoints } from "@/lib/format";
import { formatCents } from "@/lib/money";
import type { Cents } from "@/lib/types";

/** Stripe does not accept card charges under $0.50, so a smaller fee is simply not charged. */
export const MIN_CHARGE_CENTS = 50;
/** Upper bound on the savings a single call can claim ($50,000). Stops absurd amounts reaching Stripe. */
export const MAX_ANNUAL_SAVINGS_CENTS = 5_000_000;

const checkoutBodySchema = z.object({
  // Call ids are UUIDs made in the browser (or "id-..." where crypto.randomUUID is missing).
  callId: z.string().regex(/^[A-Za-z0-9_-]{1,64}$/),
  annualSavingsCents: z.number().int().positive().lt(MAX_ANNUAL_SAVINGS_CENTS),
  label: z.string().trim().min(1).max(80),
});

export type CheckoutBody = z.infer<typeof checkoutBodySchema>;

const FIELD_RULES: Record<keyof CheckoutBody, string> = {
  callId: "callId must be a short id made of letters, digits, dashes or underscores.",
  annualSavingsCents: `annualSavingsCents must be a whole number of cents, above 0 and below ${MAX_ANNUAL_SAVINGS_CENTS}.`,
  label: "label must be 1 to 80 characters.",
};

/** Validate the body of POST /api/checkout. The message names the first field that is wrong. */
export function parseCheckoutBody(body: unknown): { ok: true; body: CheckoutBody } | { ok: false; message: string } {
  const result = checkoutBodySchema.safeParse(body);
  if (result.success) return { ok: true, body: result.data };
  const field = result.error.issues[0]?.path[0];
  const rule = typeof field === "string" && field in FIELD_RULES ? FIELD_RULES[field as keyof CheckoutBody] : null;
  return { ok: false, message: rule ?? "Send callId, annualSavingsCents and label as JSON." };
}

/**
 * What to charge for a win: Haggle's fee on the first-year savings, or 0 when that fee is under
 * the minimum charge. The fee rule is a parameter so this can be tested without the engine.
 */
export function chargeForWin(annualSavingsCents: Cents, feeFor: (savings: Cents) => Cents = feeForWin): Cents {
  const feeCents = feeFor(annualSavingsCents);
  return feeCents >= MIN_CHARGE_CENTS ? feeCents : 0;
}

/**
 * The public origin for return links: NEXT_PUBLIC_SITE_URL when it is a valid http(s) URL,
 * otherwise the origin the request came in on.
 */
export function siteOrigin(requestUrl: string, configuredSiteUrl: string | undefined): string {
  const configured = configuredSiteUrl?.trim();
  if (configured) {
    try {
      const url = new URL(configured);
      if (url.protocol === "https:" || url.protocol === "http:") return url.origin;
    } catch {
      // Not a URL: fall through to the request origin.
    }
  }
  return new URL(requestUrl).origin;
}

/** Where Stripe sends the visitor after paying, and after backing out. Both land on the win page. */
export function returnUrls(origin: string, callId: string): { successUrl: string; cancelUrl: string } {
  const winPage = `${origin}/win?call=${encodeURIComponent(callId)}`;
  // Built by hand because Stripe fills in {CHECKOUT_SESSION_ID} itself and needs the braces unescaped.
  return { successUrl: `${winPage}&session_id={CHECKOUT_SESSION_ID}`, cancelUrl: winPage };
}

/** The one-time payment Stripe Checkout should collect for this win. */
export function checkoutSessionParams(input: {
  body: CheckoutBody;
  chargeCents: Cents;
  origin: string;
}): Stripe.Checkout.SessionCreateParams {
  const { body, chargeCents, origin } = input;
  const { successUrl, cancelUrl } = returnUrls(origin, body.callId);
  return {
    mode: "payment",
    submit_type: "pay",
    success_url: successUrl,
    cancel_url: cancelUrl,
    // The verify route reads this back to tie the payment to the call.
    metadata: { callId: body.callId },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: chargeCents,
          product_data: {
            name: `Haggle fee: ${body.label}`,
            description: `${formatPoints(WIN_FEE_BPS)}% of ${formatCents(body.annualSavingsCents)} in first-year savings. Charged only after a win.`,
          },
        },
      },
    ],
  };
}

/** Checkout Session ids from Stripe test mode. Live ids ("cs_live_...") never match. */
export function isTestSessionId(sessionId: string): boolean {
  return /^cs_test_[A-Za-z0-9]{1,200}$/.test(sessionId);
}

export type PaymentStatus = { paid: boolean; amountCents: Cents; callId: string | null };

/** What GET /api/checkout/verify reports about a session. */
export function paymentStatus(
  session: Pick<Stripe.Checkout.Session, "payment_status" | "amount_total" | "metadata">,
): PaymentStatus {
  return {
    paid: session.payment_status === "paid",
    amountCents: session.amount_total ?? 0,
    callId: session.metadata?.callId ?? null,
  };
}
