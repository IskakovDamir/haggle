// CONTRACT STUB. The engine owner replaces the bodies (and may split into files) but keeps these exports
// and signatures. See SPEC.md, "Engine".
import type { Analysis, Bps, CallOutcome, CardAccount, Cents, IsoDate, Payoff, Savings } from "@/lib/types";

/** Minimum payment: 1% of the balance plus the month's interest, at least $25, or the whole balance if smaller. */
export const MIN_PAYMENT = { percentOfBalanceBps: 100, floorCents: 2500 } as const;
/** Haggle's fee: 20% of first-year savings, charged only after a win. */
export const WIN_FEE_BPS = 2000;
/** Average APR cut for cardholders who ask, used as the expected value before a call. */
export const EXPECTED_APR_CUT_BPS = 630;

const todo = (name: string): never => {
  throw new Error(`engine.${name} is not implemented yet`);
};

/** One month of interest on a balance, rounded half up to the cent. */
export function monthlyInterestCents(balanceCents: Cents, aprBps: Bps): Cents {
  void balanceCents;
  void aprBps;
  return todo("monthlyInterestCents");
}

/** Interest over 12 months if the balance stays where it is: balance x APR. */
export function annualInterestCents(balanceCents: Cents, aprBps: Bps): Cents {
  void balanceCents;
  void aprBps;
  return todo("annualInterestCents");
}

/** Pay only the minimum each month until the balance is gone. */
export function simulateMinimumPayments(balanceCents: Cents, aprBps: Bps): Payoff {
  void balanceCents;
  void aprBps;
  return todo("simulateMinimumPayments");
}

/** Pay a fixed amount each month. paidOff is false when it never covers the interest. */
export function simulateFixedPayment(balanceCents: Cents, aprBps: Bps, paymentCents: Cents): Payoff {
  void balanceCents;
  void aprBps;
  void paymentCents;
  return todo("simulateFixedPayment");
}

/** What the debt costs, which asks are worth making, and in what order. */
export function analyze(cards: CardAccount[], today: IsoDate): Analysis {
  void cards;
  void today;
  return todo("analyze");
}

/** First-year savings from what the bank granted on a call, and Haggle's fee for it. */
export function savingsFromOutcome(card: CardAccount, outcome: CallOutcome): Savings {
  void card;
  void outcome;
  return todo("savingsFromOutcome");
}

/** 20% of first-year savings, rounded to the cent. */
export function feeForWin(annualSavingsCents: Cents): Cents {
  void annualSavingsCents;
  return todo("feeForWin");
}
