// POST /api/share. The browser holds the call, so the server does not take its word for the result:
// it runs verifyOutcome on the transcript again and recomputes savings with the engine, then builds
// and signs the payload from what survives. A forged outcome loses every number the bank did not say.
import { z } from "zod";
import { savingsFromOutcome } from "@/lib/engine";
import { verifyOutcome } from "@/lib/negotiator";
import { allow, ok, problem, readJson } from "@/lib/server/http";
import type { CardAccount } from "@/lib/types";
import { ShareError, buildPayload } from "./payload";
import { signPayload } from "./sign";

/**
 * Every call in this build is a practice call: the person on the other end plays the bank, and the
 * win screen labels each result "practice call". Flip this when Haggle calls real banks.
 */
export const ALL_CALLS_ARE_PRACTICE = true;

const cents = z.number().int().min(0).max(1e10);
const bps = z.number().int().min(0).max(10_000);

const bodySchema = z.object({
  bank: z.string().trim().min(1).max(60),
  card: z.object({ purchaseAprBps: bps, balanceCents: cents, annualFeeCents: cents, aprBeforeMissBps: bps.nullable() }),
  outcome: z.object({
    result: z.enum(["won", "partial", "declined", "unclear"]),
    aprAfterBps: bps.nullable(),
    annualFeeWaivedCents: cents.nullable(),
    lateFeeRefundCents: cents.nullable(),
    creditLimitAfterCents: cents.nullable(),
    statementCreditCents: cents.nullable(),
    followUp: z.string().max(500).nullable(),
    evidence: z.array(z.object({ quote: z.string().max(500), turnIndex: z.number().int().min(0) })).max(20),
  }),
  turns: z.array(z.object({ role: z.enum(["agent", "bank"]), text: z.string().max(1000), at: z.number() })).min(1).max(80),
  /** True when the card came from a sample statement. */
  sample: z.boolean(),
});

/** Only what savingsFromOutcome reads is real; the rest is a neutral shape so the engine's type is satisfied. */
function cardForEngine(card: z.infer<typeof bodySchema>["card"]): CardAccount {
  return {
    id: "share",
    issuer: "other",
    issuerName: "",
    cardName: "",
    last4: null,
    balanceCents: card.balanceCents,
    creditLimitCents: null,
    purchaseAprBps: card.purchaseAprBps,
    penaltyAprBps: null,
    promo: null,
    minimumPaymentCents: null,
    annualFeeCents: card.annualFeeCents,
    lateFeeCents: 0,
    interestChargedCents: null,
    statementDate: null,
    dueDate: null,
    memberSinceYear: null,
    latePaymentsLast12m: null,
  };
}

export async function handleShare(request: Request): Promise<Response> {
  if (!allow(request, "share", 20, 60_000)) return problem("rate_limited", "Too many share links at once. Try again in a minute.");
  const parsed = bodySchema.safeParse(await readJson(request));
  if (!parsed.success) return problem("bad_request", "We could not read that result.");
  const body = parsed.data;

  const outcome = verifyOutcome(body.outcome, body.turns);
  const savings = savingsFromOutcome(cardForEngine(body.card), outcome);
  try {
    const payload = buildPayload({
      bank: body.bank,
      card: body.card,
      outcome,
      savings,
      practice: ALL_CALLS_ARE_PRACTICE || body.sample,
      date: new Date().toISOString().slice(0, 10),
    });
    const token = await signPayload(payload);
    return ok({ url: `${new URL(request.url).origin}/w/${token}`, token });
  } catch (error) {
    if (error instanceof ShareError) return problem("unreadable", "Only a verified win can be shared.");
    throw error;
  }
}
