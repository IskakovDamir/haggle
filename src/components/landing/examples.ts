// The worked examples on the landing page. They are computed by the same engine as the plan,
// never typed in, so the page cannot quote a number the product would not produce.
import { annualInterestCents, minimumPaymentCents, monthlyInterestCents, simulateMinimumPayments } from "@/lib/engine";
import type { Bps, Cents, Payoff } from "@/lib/types";

const TRAP = { balanceCents: 800_000, aprBps: 2400 };
const BANK = { balanceCents: 800_000, aprBps: 2000, retainedAprBps: 1500 };

export type TrapExample = {
  balanceCents: Cents;
  aprBps: Bps;
  minimumOnly: Payoff;
  firstPaymentCents: Cents;
  firstMonthInterestCents: Cents;
};

/** What the bank earns in a year from one customer, in three futures. */
export type BankExample = {
  balanceCents: Cents;
  aprBps: Bps;
  retainedAprBps: Bps;
  ifNothingChangesCents: Cents;
  ifCustomerLeavesCents: Cents;
  ifRateIsCutCents: Cents;
};

export type LandingExamples = { trap: TrapExample; bank: BankExample };

/**
 * Null when the engine cannot produce the numbers. The landing page then leaves out the two
 * sections that need them instead of failing as a whole.
 */
export function landingExamples(): LandingExamples | null {
  try {
    return {
      trap: {
        ...TRAP,
        minimumOnly: simulateMinimumPayments(TRAP.balanceCents, TRAP.aprBps),
        firstPaymentCents: minimumPaymentCents(TRAP.balanceCents, TRAP.aprBps),
        firstMonthInterestCents: monthlyInterestCents(TRAP.balanceCents, TRAP.aprBps),
      },
      bank: {
        ...BANK,
        ifNothingChangesCents: annualInterestCents(BANK.balanceCents, BANK.aprBps),
        ifCustomerLeavesCents: annualInterestCents(BANK.balanceCents, 0),
        ifRateIsCutCents: annualInterestCents(BANK.balanceCents, BANK.retainedAprBps),
      },
    };
  } catch {
    return null;
  }
}
