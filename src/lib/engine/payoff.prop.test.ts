import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  MAX_PAYOFF_MONTHS,
  MIN_PAYMENT,
  minimumPaymentCents,
  monthlyInterestCents,
  simulateFixedPayment,
  simulateMinimumPayments,
  traceFixedPayment,
  traceMinimumPayments,
} from "./index";
import { aprBps, balanceCents } from "./test-arbitraries";

const paymentCents = fc.integer({ min: 0, max: 2_000_000 });

/** Months until the balance is gone. A balance that is never paid off takes forever. */
const monthsToPayoff = (payoff: { months: number; paidOff: boolean }) => (payoff.paidOff ? payoff.months : Infinity);

describe("payoff properties", () => {
  it("SPEC: principal paid plus the remaining balance equals the starting balance (minimum payments)", () => {
    fc.assert(
      fc.property(balanceCents, aprBps, (balance, apr) => {
        const trace = traceMinimumPayments(balance, apr);
        expect(trace.principalPaidCents + trace.remainingBalanceCents).toBe(balance);
        expect(trace.totalPaidCents).toBe(trace.principalPaidCents + trace.totalInterestCents);
      }),
    );
  });

  it("SPEC: principal paid plus the remaining balance equals the starting balance (fixed payment)", () => {
    fc.assert(
      fc.property(balanceCents, aprBps, paymentCents, (balance, apr, payment) => {
        const trace = traceFixedPayment(balance, apr, payment);
        expect(trace.principalPaidCents + trace.remainingBalanceCents).toBe(balance);
        expect(trace.totalPaidCents).toBe(trace.principalPaidCents + trace.totalInterestCents);
        expect(trace.remainingBalanceCents).toBeGreaterThanOrEqual(0);
        expect(trace.paidOff).toBe(trace.remainingBalanceCents === 0);
      }),
    );
  });

  it("a paid-off balance cost exactly the balance plus the interest", () => {
    fc.assert(
      fc.property(balanceCents, aprBps, paymentCents, (balance, apr, payment) => {
        for (const payoff of [simulateMinimumPayments(balance, apr), simulateFixedPayment(balance, apr, payment)]) {
          if (payoff.paidOff) expect(payoff.totalPaidCents - payoff.totalInterestCents).toBe(balance);
        }
      }),
    );
  });

  it("minimum payments always clear the balance, well inside the 1,200 month cap", () => {
    fc.assert(
      fc.property(balanceCents, aprBps, (balance, apr) => {
        const payoff = simulateMinimumPayments(balance, apr);
        expect(payoff.paidOff).toBe(true);
        expect(payoff.months).toBeLessThan(MAX_PAYOFF_MONTHS);
      }),
    );
  });

  it("the minimum payment is at least $25 and never more than what is owed", () => {
    fc.assert(
      fc.property(balanceCents, aprBps, (balance, apr) => {
        const owed = balance + monthlyInterestCents(balance, apr);
        const payment = minimumPaymentCents(balance, apr);
        expect(payment).toBeLessThanOrEqual(owed);
        expect(payment).toBeGreaterThanOrEqual(Math.min(MIN_PAYMENT.floorCents, owed));
      }),
    );
  });

  it("SPEC: a higher APR never costs less (minimum payments)", () => {
    fc.assert(
      fc.property(balanceCents, aprBps, aprBps, (balance, a, b) => {
        const [lower, higher] = a <= b ? [a, b] : [b, a];
        const cheap = simulateMinimumPayments(balance, lower);
        const dear = simulateMinimumPayments(balance, higher);
        expect(dear.totalInterestCents).toBeGreaterThanOrEqual(cheap.totalInterestCents);
        expect(dear.months).toBeGreaterThanOrEqual(cheap.months);
      }),
    );
  });

  it("SPEC: a higher APR never costs less (fixed payment that pays off at both rates)", () => {
    fc.assert(
      fc.property(balanceCents, aprBps, aprBps, paymentCents, (balance, a, b, payment) => {
        const [lower, higher] = a <= b ? [a, b] : [b, a];
        const cheap = simulateFixedPayment(balance, lower, payment);
        const dear = simulateFixedPayment(balance, higher, payment);
        fc.pre(cheap.paidOff && dear.paidOff);
        expect(dear.totalInterestCents).toBeGreaterThanOrEqual(cheap.totalInterestCents);
        expect(dear.months).toBeGreaterThanOrEqual(cheap.months);
      }),
    );
  });

  it("SPEC: a higher payment never takes longer", () => {
    fc.assert(
      fc.property(balanceCents, aprBps, paymentCents, paymentCents, (balance, apr, a, b) => {
        const [lower, higher] = a <= b ? [a, b] : [b, a];
        const slow = simulateFixedPayment(balance, apr, lower);
        const fast = simulateFixedPayment(balance, apr, higher);
        expect(monthsToPayoff(fast)).toBeLessThanOrEqual(monthsToPayoff(slow));
        if (slow.paidOff) {
          expect(fast.paidOff).toBe(true);
          expect(fast.totalInterestCents).toBeLessThanOrEqual(slow.totalInterestCents);
        }
      }),
    );
  });

  it("a higher payment never takes longer, for payments just above the interest", () => {
    // The slowest payoffs live here, so this is where a rounding slip would show first.
    const smallExtra = fc.integer({ min: 1, max: 5_000 });
    fc.assert(
      fc.property(balanceCents, aprBps, smallExtra, smallExtra, (balance, apr, a, b) => {
        const interest = monthlyInterestCents(balance, apr);
        const [lower, higher] = a <= b ? [a, b] : [b, a];
        const slow = simulateFixedPayment(balance, apr, interest + lower);
        const fast = simulateFixedPayment(balance, apr, interest + higher);
        expect(monthsToPayoff(fast)).toBeLessThanOrEqual(monthsToPayoff(slow));
      }),
    );
  });

  it("SPEC: a payment that does not cover the first month's interest never pays off", () => {
    fc.assert(
      fc.property(balanceCents, aprBps, fc.double({ min: 0, max: 1, maxExcluded: true, noNaN: true }), (balance, apr, share) => {
        const interest = monthlyInterestCents(balance, apr);
        fc.pre(interest > 0);
        const payment = Math.floor(interest * share);
        expect(simulateFixedPayment(balance, apr, payment).paidOff).toBe(false);
      }),
    );
  });

  it("SPEC: no simulation runs past 1,200 months, and each payment is at most the fixed amount", () => {
    fc.assert(
      fc.property(balanceCents, aprBps, paymentCents, (balance, apr, payment) => {
        const payoff = simulateFixedPayment(balance, apr, payment);
        expect(payoff.months).toBeLessThanOrEqual(MAX_PAYOFF_MONTHS);
        expect(payoff.totalPaidCents).toBeLessThanOrEqual(payoff.months * payment);
        // Every payment but the last is the full amount.
        if (payoff.paidOff && payoff.months > 0) {
          expect(payoff.totalPaidCents).toBeGreaterThan((payoff.months - 1) * payment);
        }
      }),
    );
  });
});
