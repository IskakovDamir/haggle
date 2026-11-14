import { describe, expect, it } from "vitest";
import {
  MAX_PAYOFF_MONTHS,
  minimumPaymentCents,
  simulateFixedPayment,
  simulateMinimumPayments,
  traceFixedPayment,
  traceMinimumPayments,
} from "./index";

/**
 * A deliberately naive second opinion on the minimum-payment simulation. It shares no code with the
 * engine: plain number arithmetic, one ledger row per month, and the totals added up afterwards.
 */
function naiveMinimumPayments(startCents: number, aprBps: number) {
  const ledger: { interest: number; payment: number }[] = [];
  let balance = startCents;
  while (balance > 0 && ledger.length < 1200) {
    const interest = Math.round((balance * aprBps) / 10000 / 12);
    const owed = balance + interest;
    let payment = Math.round(balance / 100) + interest;
    if (payment < 2500) payment = 2500;
    if (payment > owed) payment = owed;
    ledger.push({ interest, payment });
    balance = owed - payment;
  }
  let totalInterestCents = 0;
  let totalPaidCents = 0;
  for (const row of ledger) {
    totalInterestCents += row.interest;
    totalPaidCents += row.payment;
  }
  return { months: ledger.length, totalInterestCents, totalPaidCents, paidOff: balance === 0 };
}

describe("minimumPaymentCents", () => {
  it("SPEC: on $8,000 at 24% the first payment is $240.00, of which $160.00 is interest", () => {
    expect(minimumPaymentCents(800_000, 2400)).toBe(24_000);
    expect(minimumPaymentCents(800_000, 2400) - 8_000).toBe(16_000);
  });

  it("is at least $25", () => {
    // 1% of $500 is $5 and the interest is $10, so the $25 floor applies.
    expect(minimumPaymentCents(50_000, 2400)).toBe(2_500);
  });

  it("is never more than the balance plus the month's interest", () => {
    // $10.00 owed plus 20 cents of interest is less than the $25 floor.
    expect(minimumPaymentCents(1_000, 2400)).toBe(1_020);
  });

  it("is 0 when nothing is owed", () => {
    expect(minimumPaymentCents(0, 2400)).toBe(0);
  });
});

describe("simulateMinimumPayments", () => {
  it("SPEC: $8,000 at 24% takes 270 to 290 months and $14,500 to $15,300 in interest", () => {
    const payoff = simulateMinimumPayments(800_000, 2400);
    expect(payoff.paidOff).toBe(true);
    expect(payoff.months).toBeGreaterThanOrEqual(270);
    expect(payoff.months).toBeLessThanOrEqual(290);
    expect(payoff.totalInterestCents).toBeGreaterThanOrEqual(1_450_000);
    expect(payoff.totalInterestCents).toBeLessThanOrEqual(1_530_000);
  });

  it("pins the exact result for $8,000 at 24%, so a regression shows", () => {
    expect(simulateMinimumPayments(800_000, 2400)).toEqual({
      months: 281,
      totalInterestCents: 1_488_705,
      totalPaidCents: 2_288_705,
      paidOff: true,
    });
  });

  it("agrees with the naive implementation on the SPEC example", () => {
    expect(simulateMinimumPayments(800_000, 2400)).toEqual(naiveMinimumPayments(800_000, 2400));
  });

  it("agrees with the naive implementation across balances and rates", () => {
    const balances = [1, 49, 50, 2_499, 2_500, 2_501, 10_000, 99_999, 250_000, 310_000, 800_000, 840_000, 5_000_000];
    const aprs = [0, 1, 999, 1500, 2400, 2724, 2999, 3600];
    for (const balance of balances) {
      for (const apr of aprs) {
        expect(simulateMinimumPayments(balance, apr), `${balance} cents at ${apr} bps`).toEqual(
          naiveMinimumPayments(balance, apr),
        );
      }
    }
  });

  it("pays everything that was borrowed, plus the interest", () => {
    const payoff = simulateMinimumPayments(800_000, 2400);
    expect(payoff.totalPaidCents - payoff.totalInterestCents).toBe(800_000);
  });

  it("zero balance: nothing to pay, already paid off", () => {
    expect(simulateMinimumPayments(0, 2400)).toEqual({
      months: 0,
      totalInterestCents: 0,
      totalPaidCents: 0,
      paidOff: true,
    });
  });

  it("0% APR: no interest, only the balance is paid", () => {
    // 1% a month until the $25 floor takes over below $2,500.
    expect(simulateMinimumPayments(800_000, 0)).toEqual({
      months: 216,
      totalInterestCents: 0,
      totalPaidCents: 800_000,
      paidOff: true,
    });
  });

  it("a tiny balance below the $25 floor is gone in one payment", () => {
    expect(simulateMinimumPayments(1_000, 2400)).toEqual({
      months: 1,
      totalInterestCents: 20,
      totalPaidCents: 1_020,
      paidOff: true,
    });
  });

  it("a balance just above the $25 floor takes two payments", () => {
    // $26.00 plus 52 cents of interest, minus $25.00, leaves $1.52. That and 3 cents of interest go next month.
    expect(simulateMinimumPayments(2_600, 2400)).toEqual({
      months: 2,
      totalInterestCents: 55,
      totalPaidCents: 2_655,
      paidOff: true,
    });
  });
});

describe("simulateFixedPayment", () => {
  it("$240 a month on $8,000 at 24% matches the textbook amortization formula", () => {
    const monthlyRate = 0.24 / 12;
    const textbookMonths = Math.ceil(-Math.log(1 - (monthlyRate * 8_000) / 240) / Math.log(1 + monthlyRate));
    const payoff = simulateFixedPayment(800_000, 2400, 24_000);
    expect(textbookMonths).toBe(56);
    expect(payoff.months).toBe(textbookMonths);
    expect(payoff).toEqual({ months: 56, totalInterestCents: 531_537, totalPaidCents: 1_331_537, paidOff: true });
  });

  it("is far faster than the minimum when the first minimum payment is kept up", () => {
    const fixed = simulateFixedPayment(800_000, 2400, minimumPaymentCents(800_000, 2400));
    const minimum = simulateMinimumPayments(800_000, 2400);
    expect(fixed.months).toBeLessThan(minimum.months);
    expect(fixed.totalInterestCents).toBeLessThan(minimum.totalInterestCents);
  });

  it("SPEC: paidOff is false when the payment does not cover the first month's interest", () => {
    // The first month's interest on $8,000 at 24% is $160.00. A payment of $159.99 only lets the balance grow.
    expect(simulateFixedPayment(800_000, 2400, 15_999)).toEqual({
      months: 0,
      totalInterestCents: 0,
      totalPaidCents: 0,
      paidOff: false,
    });
    expect(traceFixedPayment(800_000, 2400, 15_999).remainingBalanceCents).toBe(800_000);
  });

  it("SPEC: stops at 1,200 months when the payment only just covers the interest", () => {
    expect(MAX_PAYOFF_MONTHS).toBe(1200);
    // Exactly the interest, every month: the balance never moves.
    const payoff = traceFixedPayment(800_000, 2400, 16_000);
    expect(payoff.months).toBe(1200);
    expect(payoff.paidOff).toBe(false);
    expect(payoff.totalInterestCents).toBe(1200 * 16_000);
    expect(payoff.remainingBalanceCents).toBe(800_000);
  });

  it("one cent above the interest does pay off, slowly", () => {
    expect(simulateFixedPayment(800_000, 2400, 16_001)).toEqual({
      months: 493,
      totalInterestCents: 7_087_828,
      totalPaidCents: 7_887_828,
      paidOff: true,
    });
  });

  it("0% APR: the balance divided by the payment, rounded up", () => {
    expect(simulateFixedPayment(800_000, 0, 10_000)).toEqual({
      months: 80,
      totalInterestCents: 0,
      totalPaidCents: 800_000,
      paidOff: true,
    });
    expect(simulateFixedPayment(800_001, 0, 10_000).months).toBe(81);
  });

  it("the last payment is only what is still owed", () => {
    // $100.00 at 24% with $60 a month: $60, then the remaining $42.00 plus 84 cents of interest.
    expect(simulateFixedPayment(10_000, 2400, 6_000)).toEqual({
      months: 2,
      totalInterestCents: 284,
      totalPaidCents: 10_284,
      paidOff: true,
    });
  });

  it("zero balance: already paid off, whatever the payment", () => {
    expect(simulateFixedPayment(0, 2400, 0)).toEqual({ months: 0, totalInterestCents: 0, totalPaidCents: 0, paidOff: true });
  });

  it("a payment of nothing never pays off a balance", () => {
    expect(simulateFixedPayment(800_000, 2400, 0).paidOff).toBe(false);
    expect(simulateFixedPayment(800_000, 0, 0)).toMatchObject({ months: 1200, paidOff: false, totalPaidCents: 0 });
  });
});

describe("payoff traces", () => {
  it("principal paid plus the remaining balance is the starting balance", () => {
    const paid = traceMinimumPayments(840_000, 2724);
    expect(paid.principalPaidCents + paid.remainingBalanceCents).toBe(840_000);
    expect(paid.remainingBalanceCents).toBe(0);

    // A payment equal to the monthly interest ($190.68) never touches the principal.
    const stuck = traceFixedPayment(840_000, 2724, 19_068);
    expect(stuck.principalPaidCents).toBe(0);
    expect(stuck.remainingBalanceCents).toBe(840_000);
    expect(stuck.totalPaidCents).toBe(stuck.totalInterestCents);
  });
});
