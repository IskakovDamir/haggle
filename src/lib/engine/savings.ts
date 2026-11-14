import { formatApr } from "@/lib/format";
import type { CallOutcome, CardAccount, Cents, Savings } from "@/lib/types";
import { WIN_FEE_BPS } from "./constants";
import { annualInterestCents, shareOfCents } from "./interest";
import { wholeOrZero } from "./math";

/** 20% of first-year savings, rounded to the cent. */
export function feeForWin(annualSavingsCents: Cents): Cents {
  return shareOfCents(annualSavingsCents, WIN_FEE_BPS);
}

/** Interest saved in a year by the new rate, with the balance held where it is. 0 unless the rate went down. */
function aprSavingsLine(card: CardAccount, aprAfterBps: number | null): Savings["lines"][number] | null {
  const before = wholeOrZero(card.purchaseAprBps);
  if (aprAfterBps === null || !(aprAfterBps >= 0) || aprAfterBps >= before) return null;
  const after = Math.round(aprAfterBps);
  return {
    label: `APR lowered from ${formatApr(before)} to ${formatApr(after)}`,
    cents: annualInterestCents(card.balanceCents, before - after),
  };
}

/**
 * First-year savings from what the bank granted on a call, and Haggle's fee for it.
 * Only a win or a partial win counts. A declined call, or one whose outcome could not be confirmed,
 * saves nothing and costs nothing, whatever numbers the outcome carries.
 */
export function savingsFromOutcome(card: CardAccount, outcome: CallOutcome): Savings {
  if (outcome.result !== "won" && outcome.result !== "partial") {
    return { annualSavingsCents: 0, lines: [], feeCents: 0 };
  }

  const lines = [
    aprSavingsLine(card, outcome.aprAfterBps),
    { label: "Annual fee waived", cents: wholeOrZero(outcome.annualFeeWaivedCents ?? 0) },
    { label: "Late fee refunded", cents: wholeOrZero(outcome.lateFeeRefundCents ?? 0) },
    { label: "Statement credit", cents: wholeOrZero(outcome.statementCreditCents ?? 0) },
  ].filter((line): line is Savings["lines"][number] => line !== null && line.cents > 0);

  const annualSavingsCents = lines.reduce((total, line) => total + line.cents, 0);
  return { annualSavingsCents, lines, feeCents: feeForWin(annualSavingsCents) };
}
