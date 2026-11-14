import { MIN_CHARGE_CENTS, chargeForWin, checkoutSessionParams, parseCheckoutBody, siteOrigin } from "@/lib/pay/checkout";
import { stripeClient, stripeProblem } from "@/lib/pay/stripe";
import { formatCents } from "@/lib/money";
import { allow, ok, problem, readJson } from "@/lib/server/http";

// POST { callId, annualSavingsCents, label }: start Stripe's hosted checkout (test mode) for the fee on one win.
// The fee is computed here from the savings; an amount sent by the browser is never charged as is.
export async function POST(request: Request) {
  if (!allow(request, "checkout", 10, 60_000)) {
    return problem("rate_limited", "Too many checkout attempts. Wait a minute and try again.");
  }

  const access = stripeClient();
  if (!access.ok) return problem("not_configured", access.message);

  const parsed = parseCheckoutBody(await readJson(request));
  if (!parsed.ok) return problem("bad_request", parsed.message);

  try {
    const chargeCents = chargeForWin(parsed.body.annualSavingsCents);
    if (chargeCents === 0) {
      return problem("bad_request", `The fee on this win is under ${formatCents(MIN_CHARGE_CENTS)}, so there is nothing to pay.`);
    }

    const origin = siteOrigin(request.url, process.env.NEXT_PUBLIC_SITE_URL);
    const session = await access.stripe.checkout.sessions.create(
      checkoutSessionParams({ body: parsed.body, chargeCents, origin }),
    );
    if (!session.url) return problem("failed", "Stripe did not return a checkout page. Nothing was charged.");
    return ok({ url: session.url });
  } catch (error) {
    console.error("[checkout] could not create a session:", error instanceof Error ? error.message : error);
    const { code, message } = stripeProblem(error, "We could not start checkout. Nothing was charged. Please try again.");
    return problem(code, message);
  }
}
