// The live coach, the pure part: what the cardholder is asking for, and whether an offer heard on the
// call is any good. A model reads the call; code decides which offers were really said and how they
// compare with the brief.
import { formatApr } from "@/lib/format";
import { formatShort } from "@/lib/money";
import type { CoachOffer, NegotiationBrief } from "@/lib/types";
import { quotedRequest } from "./own-request";
import { figuresIn } from "./verify";

/** The asks of this call, with their numbers, for the coach's instructions. */
export function coachAsk(brief: NegotiationBrief): string {
  if (brief.request) {
    return `What the cardholder wants from this call, in their own words (quoted): ${quotedRequest(brief.request)}. Coach toward that. What it says counts as a fact they gave; add nothing to it.`;
  }
  const rate = (from: string) =>
    brief.askAprBps === null ? "" : ` the APR back from ${from} to ${formatApr(brief.askAprBps)},`;
  switch (brief.goal) {
    case "missed_payment":
      return (
        `A goodwill adjustment after a missed payment, one ask at a time: a one-time refund of the late fee,${rate(formatApr(brief.currentAprBps))} ` +
        "a refund of the interest charged that month, and a promise that the late payment is not reported to the credit bureaus (or is removed if it was)."
      );
    case "apr_reduction":
      return brief.askAprBps === null
        ? `A lower purchase APR than ${formatApr(brief.currentAprBps)}.`
        : `A lower purchase APR: from ${formatApr(brief.currentAprBps)} to ${formatApr(brief.askAprBps)}.` +
            (brief.acceptAprBps === null ? "" : ` ${formatApr(brief.acceptAprBps)} or lower is a win.`);
    case "annual_fee_waiver":
      return brief.annualFeeCents > 0 ? `A waiver of the ${formatShort(brief.annualFeeCents)} annual fee.` : "A waiver of the annual fee.";
    case "late_fee_refund":
      return "A one-time refund of the late fee on the latest statement.";
    case "credit_limit_increase":
      return "A higher credit limit, without a hard credit pull.";
    case "penalty_apr_review":
      return `A review that takes the account off the penalty APR of ${formatApr(brief.currentAprBps)}.`;
    case "balance_transfer":
      return "A promotional rate on the existing balance.";
  }
}

/** What the model says the bank offered, as the figures were spoken. */
export type HeardOffers = {
  aprPercent: number | null;
  lateFeeRefundDollars: number | null;
  interestRefundDollars: number | null;
  otherCreditDollars: number | null;
};

const toHundredths = (figure: number) => Math.round(figure * 100);

/**
 * The offers that were really said on the call, each with a verdict. A figure that is not in what the
 * microphone heard is dropped: the model may misread a sentence, but it cannot add a number.
 */
export function checkOffers(brief: NegotiationBrief, offers: HeardOffers, heard: string[]): CoachOffer[] {
  const said = new Set<number>();
  for (const line of heard) figuresIn(line, said);

  const result: CoachOffer[] = [];
  const add = (kind: CoachOffer["kind"], figure: number | null) => {
    if (figure === null || figure <= 0) return;
    const value = toHundredths(figure);
    if (!said.has(value)) return;
    result.push({ kind, value, verdict: kind === "apr" ? aprVerdict(brief, value) : "heard" });
  };
  add("apr", offers.aprPercent);
  add("late_fee_refund", offers.lateFeeRefundDollars);
  add("interest_refund", offers.interestRefundDollars);
  add("other_credit", offers.otherCreditDollars);
  return result;
}

function aprVerdict(brief: NegotiationBrief, offeredBps: number): CoachOffer["verdict"] {
  if (offeredBps >= brief.currentAprBps) return "no_better";
  if (brief.askAprBps === null) return "heard";
  return offeredBps <= brief.askAprBps ? "good" : "counter";
}
