import type { Bps, Cents, Payoff } from "@/lib/types";
import { MAX_PAYOFF_MONTHS, MIN_PAYMENT } from "./constants";
import { monthlyInterestCents, shareOfCents } from "./interest";
import { wholeOrZero } from "./math";

/** A payoff with its books open: where the starting balance went. */
export type PayoffTrace = Payoff & {
  /** Payments minus interest. Together with the remaining balance it equals the starting balance. */
  principalPaidCents: Cents;
  remainingBalanceCents: Cents;
};

/** What is due in a month, given the balance and that month's interest. */
type PaymentRule = (balanceCents: Cents, interestCents: Cents) => Cents;

const minimumDue: PaymentRule = (balanceCents, interestCents) =>
  Math.max(shareOfCents(balanceCents, MIN_PAYMENT.percentOfBalanceBps) + interestCents, MIN_PAYMENT.floorCents);

/** This month's minimum payment: 1% of the balance plus the interest, at least $25, never more than what is owed. */
export function minimumPaymentCents(balanceCents: Cents, aprBps: Bps): Cents {
  const balance = wholeOrZero(balanceCents);
  const interest = monthlyInterestCents(balance, aprBps);
  return Math.min(minimumDue(balance, interest), balance + interest);
}

/** Month by month: add the interest, take the payment, stop at zero or at the cap. */
function runPayoff(startCents: Cents, aprBps: Bps, paymentDue: PaymentRule): PayoffTrace {
  let balance = wholeOrZero(startCents);
  let months = 0;
  let totalInterestCents = 0;
  let principalPaidCents = 0;

  while (balance > 0 && months < MAX_PAYOFF_MONTHS) {
    const interest = monthlyInterestCents(balance, aprBps);
    const payment = Math.min(paymentDue(balance, interest), balance + interest);
    const principal = payment - interest;
    balance -= principal;
    totalInterestCents += interest;
    principalPaidCents += principal;
    months += 1;
  }

  return {
    months,
    totalInterestCents,
    totalPaidCents: principalPaidCents + totalInterestCents,
    paidOff: balance === 0,
    principalPaidCents,
    remainingBalanceCents: balance,
  };
}

/** Minimum payments only, with the principal and the remaining balance. */
export function traceMinimumPayments(balanceCents: Cents, aprBps: Bps): PayoffTrace {
  return runPayoff(balanceCents, aprBps, minimumDue);
}

/** A fixed monthly payment, with the principal and the remaining balance. */
export function traceFixedPayment(balanceCents: Cents, aprBps: Bps, paymentCents: Cents): PayoffTrace {
  const balance = wholeOrZero(balanceCents);
  const payment = wholeOrZero(paymentCents);
  // A payment below the first month's interest only lets the balance grow. There is nothing to add up,
  // so no month is simulated.
  if (payment < monthlyInterestCents(balance, aprBps)) {
    return {
      months: 0,
      totalInterestCents: 0,
      totalPaidCents: 0,
      paidOff: false,
      principalPaidCents: 0,
      remainingBalanceCents: balance,
    };
  }
  return runPayoff(balance, aprBps, () => payment);
}

function toPayoff({ months, totalInterestCents, totalPaidCents, paidOff }: PayoffTrace): Payoff {
  return { months, totalInterestCents, totalPaidCents, paidOff };
}

/** Pay only the minimum each month until the balance is gone. */
export function simulateMinimumPayments(balanceCents: Cents, aprBps: Bps): Payoff {
  return toPayoff(traceMinimumPayments(balanceCents, aprBps));
}

/** Pay a fixed amount each month. paidOff is false when it never covers the interest. */
export function simulateFixedPayment(balanceCents: Cents, aprBps: Bps, paymentCents: Cents): Payoff {
  return toPayoff(traceFixedPayment(balanceCents, aprBps, paymentCents));
}
