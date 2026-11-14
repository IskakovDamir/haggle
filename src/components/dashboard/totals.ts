// Paid versus saved: what Haggle cost the visitor and what the wins are worth. Pure functions over the stored calls.
import { MIN_CHARGE_CENTS } from "@/lib/pay/checkout";
import type { CallRecord, Cents } from "@/lib/types";
import { isWin, stepIdOf } from "./progress";

export type Totals = {
  /** First-year savings from confirmed wins. */
  savedCents: Cents;
  /** Fees actually paid through checkout. */
  paidCents: Cents;
  /** Fees on confirmed wins that have not been paid yet. */
  unpaidFeeCents: Cents;
  wins: number;
};

/**
 * The wins that count toward the totals: one per plan step, the latest.
 * Savings are measured from the card as it is on the statement, so two wins on the same step
 * (a rate lowered, then lowered again) would count the first cut twice.
 */
export function countedWins(calls: CallRecord[]): CallRecord[] {
  const latestByStep = new Map<string, CallRecord>();
  for (const call of calls) {
    if (isWin(call)) latestByStep.set(stepIdOf(call), call);
  }
  return [...latestByStep.values()];
}

/** A win whose fee can still be paid: not paid yet, and large enough for checkout to charge. */
export function feeIsDue(call: CallRecord): boolean {
  return isWin(call) && call.paid === null && (call.savings?.feeCents ?? 0) >= MIN_CHARGE_CENTS;
}

export function totalsFor(calls: CallRecord[]): Totals {
  const wins = countedWins(calls);
  const sum = (amounts: number[]) => amounts.reduce((total, amount) => total + amount, 0);
  return {
    savedCents: sum(wins.map((call) => call.savings?.annualSavingsCents ?? 0)),
    // Every payment counts, including one for a win that a later call replaced: the money was paid.
    paidCents: sum(calls.map((call) => call.paid?.amountCents ?? 0)),
    unpaidFeeCents: sum(wins.filter(feeIsDue).map((call) => call.savings?.feeCents ?? 0)),
    wins: wins.length,
  };
}
