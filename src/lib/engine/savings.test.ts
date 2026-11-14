import { describe, expect, it } from "vitest";
import { WIN_FEE_BPS, feeForWin, savingsFromOutcome } from "./index";
import { card, mariaCapitalOne, mariaChase, outcome } from "./test-cards";

describe("feeForWin", () => {
  it("is 20% of first-year savings", () => {
    expect(WIN_FEE_BPS).toBe(2000);
    expect(feeForWin(60_900)).toBe(12_180);
    expect(feeForWin(9_500)).toBe(1_900);
  });

  it("rounds half up to the cent", () => {
    expect(feeForWin(2)).toBe(0); // 0.4 cents
    expect(feeForWin(3)).toBe(1); // 0.6 cents
    expect(feeForWin(12)).toBe(2); // 2.4 cents
    expect(feeForWin(13)).toBe(3); // 2.6 cents
  });

  it("is 0 when nothing was saved", () => {
    expect(feeForWin(0)).toBe(0);
    expect(feeForWin(-500)).toBe(0);
  });
});

describe("savingsFromOutcome", () => {
  it("SPEC: Maria's Chase card going from 27.24% to 19.99% saves $609.00 and the fee is $121.80", () => {
    expect(savingsFromOutcome(mariaChase, outcome({ aprAfterBps: 1999 }))).toEqual({
      annualSavingsCents: 60_900,
      lines: [{ label: "APR lowered from 27.24% to 19.99%", cents: 60_900 }],
      feeCents: 12_180,
    });
  });

  it("adds a waived annual fee, a refunded late fee and a statement credit, line by line", () => {
    const savings = savingsFromOutcome(
      mariaCapitalOne,
      outcome({ aprAfterBps: 2499, annualFeeWaivedCents: 9_500, lateFeeRefundCents: 4_000, statementCreditCents: 5_000 }),
    );
    expect(savings.lines).toEqual([
      // $3,100.00 x 5 points
      { label: "APR lowered from 29.99% to 24.99%", cents: 15_500 },
      { label: "Annual fee waived", cents: 9_500 },
      { label: "Late fee refunded", cents: 4_000 },
      { label: "Statement credit", cents: 5_000 },
    ]);
    expect(savings.annualSavingsCents).toBe(34_000);
    expect(savings.feeCents).toBe(6_800);
  });

  it("counts a partial win like a win", () => {
    const savings = savingsFromOutcome(mariaCapitalOne, outcome({ result: "partial", annualFeeWaivedCents: 4_750 }));
    expect(savings).toEqual({
      annualSavingsCents: 4_750,
      lines: [{ label: "Annual fee waived", cents: 4_750 }],
      feeCents: 950,
    });
  });

  it("has no APR line when the rate did not go down", () => {
    const nothing = { annualSavingsCents: 0, lines: [], feeCents: 0 };
    expect(savingsFromOutcome(mariaChase, outcome({ aprAfterBps: 2724 }))).toEqual(nothing);
    expect(savingsFromOutcome(mariaChase, outcome({ aprAfterBps: 2999 }))).toEqual(nothing);
    expect(savingsFromOutcome(mariaChase, outcome({ aprAfterBps: null }))).toEqual(nothing);
  });

  it("a lower rate on a card with no balance saves nothing", () => {
    const paidOff = card({ purchaseAprBps: 2724 });
    expect(savingsFromOutcome(paidOff, outcome({ aprAfterBps: 1999 }))).toEqual({
      annualSavingsCents: 0,
      lines: [],
      feeCents: 0,
    });
  });

  it("a higher limit is not money", () => {
    const savings = savingsFromOutcome(mariaChase, outcome({ creditLimitAfterCents: 1_250_000 }));
    expect(savings).toEqual({ annualSavingsCents: 0, lines: [], feeCents: 0 });
  });

  it("a declined call saves nothing and costs nothing, whatever numbers it carries", () => {
    const declined = outcome({
      result: "declined",
      aprAfterBps: 1999,
      annualFeeWaivedCents: 9_500,
      lateFeeRefundCents: 4_000,
      statementCreditCents: 5_000,
    });
    expect(savingsFromOutcome(mariaChase, declined)).toEqual({ annualSavingsCents: 0, lines: [], feeCents: 0 });
  });

  it("an outcome that could not be confirmed is never charged for", () => {
    const unclear = outcome({ result: "unclear", aprAfterBps: 1999, verified: false });
    expect(savingsFromOutcome(mariaChase, unclear)).toEqual({ annualSavingsCents: 0, lines: [], feeCents: 0 });
  });
});
