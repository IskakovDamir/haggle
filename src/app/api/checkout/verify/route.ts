import { isTestSessionId, paymentStatus } from "@/lib/pay/checkout";
import { stripeClient, stripeProblem } from "@/lib/pay/stripe";
import { allow, ok, problem } from "@/lib/server/http";

// GET ?session_id=cs_test_...: ask Stripe whether a checkout session was paid. Returns { paid, amountCents, callId }.
export async function GET(request: Request) {
  // Read the query before any try block. Touching the request is what tells Next this route runs per
  // request (cacheComponents would otherwise try to prerender it), and a catch would swallow that signal.
  const sessionId = new URL(request.url).searchParams.get("session_id") ?? "";

  if (!allow(request, "checkout-verify", 30, 60_000)) {
    return problem("rate_limited", "Too many payment checks. Wait a minute and try again.");
  }

  const access = stripeClient();
  if (!access.ok) return problem("not_configured", access.message);

  if (!isTestSessionId(sessionId)) {
    return problem("bad_request", "session_id must be a Stripe test checkout session id (cs_test_...).");
  }

  try {
    const session = await access.stripe.checkout.sessions.retrieve(sessionId);
    return ok(paymentStatus(session));
  } catch (error) {
    console.error("[checkout] could not verify a session:", error instanceof Error ? error.message : error);
    const { code, message } = stripeProblem(error, "We could not check this payment with Stripe. Please try again.");
    return problem(code, message);
  }
}
