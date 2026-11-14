import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { feeForWin, savingsFromOutcome } from "./index";
import { anyCard, anyOutcome } from "./test-arbitraries";

const NOTHING = { annualSavingsCents: 0, lines: [], feeCents: 0 };

describe("savings properties", () => {
  it("SPEC: savingsFromOutcome is 0 for a declined call, whatever numbers the outcome carries", () => {
    fc.assert(
      fc.property(anyCard, anyOutcome, (card, outcome) => {
        expect(savingsFromOutcome(card, { ...outcome, result: "declined" })).toEqual(NOTHING);
      }),
    );
  });

  it("an unclear call is never charged for either", () => {
    fc.assert(
      fc.property(anyCard, anyOutcome, (card, outcome) => {
        expect(savingsFromOutcome(card, { ...outcome, result: "unclear" })).toEqual(NOTHING);
      }),
    );
  });

  it("the total is the sum of its lines, every line is worth something, and the fee is feeForWin(total)", () => {
    fc.assert(
      fc.property(anyCard, anyOutcome, (card, outcome) => {
        const savings = savingsFromOutcome(card, outcome);
        const sumOfLines = savings.lines.reduce((total, line) => total + line.cents, 0);
        expect(savings.annualSavingsCents).toBe(sumOfLines);
        expect(savings.lines.every((line) => line.cents > 0 && line.label.length > 0)).toBe(true);
        expect(savings.feeCents).toBe(feeForWin(savings.annualSavingsCents));
      }),
    );
  });

  it("a rate that did not go down adds nothing", () => {
    fc.assert(
      fc.property(anyCard, anyOutcome, fc.integer({ min: 0, max: 2000 }), (card, outcome, raisedBy) => {
        const moneyOnly = { ...outcome, result: "won" as const };
        const sameRate = savingsFromOutcome(card, { ...moneyOnly, aprAfterBps: card.purchaseAprBps + raisedBy });
        const noRate = savingsFromOutcome(card, { ...moneyOnly, aprAfterBps: null });
        expect(sameRate).toEqual(noRate);
      }),
    );
  });

  it("a lower rate after the call never saves less", () => {
    fc.assert(
      fc.property(anyCard, anyOutcome, fc.nat(4000), fc.nat(4000), (card, outcome, a, b) => {
        const [lower, higher] = a <= b ? [a, b] : [b, a];
        const won = { ...outcome, result: "won" as const };
        const better = savingsFromOutcome(card, { ...won, aprAfterBps: lower });
        const worse = savingsFromOutcome(card, { ...won, aprAfterBps: higher });
        expect(better.annualSavingsCents).toBeGreaterThanOrEqual(worse.annualSavingsCents);
      }),
    );
  });

  it("the fee is never negative, never more than the savings, and grows with them", () => {
    fc.assert(
      fc.property(fc.nat(100_000_000), fc.nat(100_000_000), (a, b) => {
        const [smaller, larger] = a <= b ? [a, b] : [b, a];
        expect(feeForWin(smaller)).toBeGreaterThanOrEqual(0);
        expect(feeForWin(larger)).toBeLessThanOrEqual(larger);
        expect(feeForWin(larger)).toBeGreaterThanOrEqual(feeForWin(smaller));
      }),
    );
  });
});
