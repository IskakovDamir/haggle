// The debt-free date for one card, before and after the wins. Pure: the engine does the simulations.
import { minimumPaymentCents, simulateFixedPayment, simulateMinimumPayments } from "@/lib/engine";
import type { Bps, CallRecord, CardAccount, Cents, IsoDate, Payoff } from "@/lib/types";
import { addMonths } from "./dates";
import { isWin } from "./progress";

export type DebtFree = {
  cardId: string;
  aprBeforeBps: Bps;
  /** The rate after the latest confirmed win that lowered it. null when no call has lowered it. */
  aprAfterBps: Bps | null;
  /** Paying only the minimum at the statement's rate. */
  before: Payoff;
  beforeDate: IsoDate | null;
  /** The same simulation at the lowered rate. null when no call has lowered it. */
  after: Payoff | null;
  afterDate: IsoDate | null;
  /**
   * Paying this month's minimum every month, without letting it shrink as the balance falls,
   * at the rate now in force. It shows how much sooner a steady payment ends the debt.
   */
  steady: { paymentCents: Cents; payoff: Payoff; date: IsoDate | null };
};

/** The card's rate after the latest confirmed win that lowered it, or null. */
export function loweredAprBps(card: CardAccount, calls: CallRecord[]): Bps | null {
  const lowered = calls.filter(
    (call) =>
      call.cardId === card.id &&
      isWin(call) &&
      call.outcome?.aprAfterBps != null &&
      call.outcome.aprAfterBps >= 0 &&
      call.outcome.aprAfterBps < card.purchaseAprBps,
  );
  return lowered.at(-1)?.outcome?.aprAfterBps ?? null;
}

/** The day the last payment lands, counted from today. null when the balance is never cleared. */
function endDate(payoff: Payoff, today: IsoDate): IsoDate | null {
  return payoff.paidOff ? addMonths(today, payoff.months) : null;
}

export function debtFreeFor(card: CardAccount, calls: CallRecord[], today: IsoDate): DebtFree {
  const aprAfterBps = loweredAprBps(card, calls);
  const before = simulateMinimumPayments(card.balanceCents, card.purchaseAprBps);
  const after = aprAfterBps === null ? null : simulateMinimumPayments(card.balanceCents, aprAfterBps);

  const aprNowBps = aprAfterBps ?? card.purchaseAprBps;
  const paymentCents = minimumPaymentCents(card.balanceCents, aprNowBps);
  const steady = simulateFixedPayment(card.balanceCents, aprNowBps, paymentCents);

  return {
    cardId: card.id,
    aprBeforeBps: card.purchaseAprBps,
    aprAfterBps,
    before,
    beforeDate: endDate(before, today),
    after,
    afterDate: after && endDate(after, today),
    steady: { paymentCents, payoff: steady, date: endDate(steady, today) },
  };
}
