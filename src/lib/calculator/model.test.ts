import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { annualInterestCents, feeForWin, simulateMinimumPayments } from "@/lib/engine";
import { calculate, defaultInput, parsePercentToBps, readInput } from "./model";

describe("calculator model", () => {
  it("matches the engine for Maria's Chase card", () => {
    // $8,400 at 27.24% is $2,288.16 a year (SPEC.md). A 7.25-point cut to 19.99% saves $609.00, fee $121.80.
    const result = calculate({ balanceCents: 840_000, aprBps: 2724, cutBps: 725 });
    expect(result.now.annualInterestCents).toBe(228_816);
    expect(result.yearSavedCents).toBe(60_900);
    expect(result.haggleFeeCents).toBe(12_180);
  });

  it("uses the Fed average APR and the survey's average cut as defaults", () => {
    expect(defaultInput()).toEqual({ balanceCents: 500_000, aprBps: 2236, cutBps: 630 });
  });

  it("never lets the rate go below zero", () => {
    const result = calculate({ balanceCents: 100_000, aprBps: 500, cutBps: 500 });
    expect(result.afterCut.aprBps).toBe(0);
    expect(result.afterCut.annualInterestCents).toBe(0);
  });

  it("a bigger cut never saves less, and savings equal the engine's difference", () => {
    fc.assert(
      fc.property(fc.integer({ min: 2_500, max: 5_000_000 }), fc.integer({ min: 100, max: 3999 }), fc.integer({ min: 0, max: 3000 }), (balance, apr, cut) => {
        const a = calculate({ balanceCents: balance, aprBps: apr, cutBps: Math.min(cut, apr) });
        const b = calculate({ balanceCents: balance, aprBps: apr, cutBps: Math.min(cut + 50, apr) });
        expect(b.yearSavedCents).toBeGreaterThanOrEqual(a.yearSavedCents);
        expect(a.yearSavedCents).toBe(annualInterestCents(balance, apr) - annualInterestCents(balance, Math.max(0, apr - Math.min(cut, apr))));
        expect(a.haggleFeeCents).toBe(feeForWin(a.yearSavedCents));
        expect(a.monthsSaved).toBeGreaterThanOrEqual(0);
      }),
      { numRuns: 60 },
    );
  });

  it("payoff numbers come straight from the engine", () => {
    const result = calculate({ balanceCents: 800_000, aprBps: 2400, cutBps: 0 });
    const engine = simulateMinimumPayments(800_000, 2400);
    expect(result.now.payoffMonths).toBe(engine.months);
    expect(result.now.payoffInterestCents).toBe(engine.totalInterestCents);
    expect(result.payoffInterestSavedCents).toBe(0);
  });
});

describe("calculator input", () => {
  it("parses percents", () => {
    expect(parsePercentToBps("24.99")).toBe(2499);
    expect(parsePercentToBps("6.3%")).toBe(630);
    expect(parsePercentToBps("abc")).toBeNull();
    expect(parsePercentToBps("1.234")).toBeNull();
  });

  it("reads valid fields and explains bad ones", () => {
    expect(readInput({ balance: "$5,000", apr: "22.36", cut: "6.3" }).input).toEqual({ balanceCents: 500_000, aprBps: 2236, cutBps: 630 });
    const bad = readInput({ balance: "", apr: "60", cut: "70" });
    expect(bad.input).toBeNull();
    expect(Object.keys(bad.errors).sort()).toEqual(["apr", "balance", "cut"]);
  });
});
