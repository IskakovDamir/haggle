// On a call about the rate, the brief decides what counts as a win, not the model that read the
// transcript. This runs after verifyOutcome, so every number it looks at was said by the bank.
import type { CallOutcome, NegotiationBrief } from "@/lib/types";

/**
 * Grade a rate call against the brief: a new APR at or under `acceptAprBps` is "won", a smaller cut
 * is "partial". A claimed win with no lower rate is "partial" when the bank granted something else,
 * and "unclear" when it granted nothing we can point to. A declined or unclear call is never upgraded.
 */
export function gradeAprResult(outcome: CallOutcome, brief: NegotiationBrief): CallOutcome {
  if (brief.goal !== "apr_reduction") return outcome;
  if (outcome.result !== "won" && outcome.result !== "partial") return outcome;

  const after = outcome.aprAfterBps;
  if (after !== null && after < brief.currentAprBps) {
    const reachedTarget = brief.acceptAprBps === null || after <= brief.acceptAprBps;
    return { ...outcome, result: reachedTarget ? "won" : "partial" };
  }

  // The rate did not go down. A "new" rate at or above the current one is the bank restating it.
  const grantedSomethingElse = [
    outcome.annualFeeWaivedCents,
    outcome.lateFeeRefundCents,
    outcome.creditLimitAfterCents,
    outcome.statementCreditCents,
  ].some((value) => value !== null);

  return grantedSomethingElse
    ? { ...outcome, aprAfterBps: null, result: "partial" }
    : { ...outcome, aprAfterBps: null, result: "unclear", verified: false };
}
