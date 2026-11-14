import { describe, expect, it } from "vitest";
import { annualInterestCents, monthlyInterestCents } from "./index";
import { mulDivHalfUp } from "./math";

describe("annualInterestCents", () => {
  it("SPEC: $8,400 at 27.24% is $2,288.16", () => {
    expect(annualInterestCents(840_000, 2724)).toBe(228_816);
  });

  it("Maria's Capital One card: $3,100 at 29.99% is $929.69", () => {
    expect(annualInterestCents(310_000, 2999)).toBe(92_969);
  });

  it("rounds half up to the cent", () => {
    expect(annualInterestCents(4, 1000)).toBe(0); // 0.4 cents
    expect(annualInterestCents(5, 1000)).toBe(1); // 0.5 cents
    expect(annualInterestCents(15, 1000)).toBe(2); // 1.5 cents
  });

  it("is 0 for a zero balance and for a 0% APR", () => {
    expect(annualInterestCents(0, 2724)).toBe(0);
    expect(annualInterestCents(840_000, 0)).toBe(0);
  });

  it("is 0 for a credit balance, a negative rate or a number that is not one", () => {
    expect(annualInterestCents(-50_000, 2724)).toBe(0);
    expect(annualInterestCents(840_000, -100)).toBe(0);
    expect(annualInterestCents(Number.NaN, 2724)).toBe(0);
    expect(annualInterestCents(840_000, Number.POSITIVE_INFINITY)).toBe(0);
  });
});

describe("monthlyInterestCents", () => {
  it("SPEC: $8,000 at 24% is $160.00 a month", () => {
    expect(monthlyInterestCents(800_000, 2400)).toBe(16_000);
  });

  it("Maria's Chase card: $8,400 at 27.24% is $190.68 a month", () => {
    expect(monthlyInterestCents(840_000, 2724)).toBe(19_068);
  });

  it("rounds half up to the cent", () => {
    expect(monthlyInterestCents(100, 599)).toBe(0); // 0.499 cents
    expect(monthlyInterestCents(100, 600)).toBe(1); // 0.5 cents
    expect(monthlyInterestCents(300, 600)).toBe(2); // 1.5 cents
  });

  it("is 0 for a zero balance and for a 0% APR", () => {
    expect(monthlyInterestCents(0, 2400)).toBe(0);
    expect(monthlyInterestCents(800_000, 0)).toBe(0);
  });
});

describe("mulDivHalfUp", () => {
  it("stays exact where a floating-point product would not", () => {
    // 9,007,199,254,740,991 x 2,999 does not fit in a double. The exact answer is checked with BigInt.
    const big = Number.MAX_SAFE_INTEGER;
    const exact = (BigInt(big) * BigInt(2999) * BigInt(2) + BigInt(10_000)) / BigInt(20_000);
    expect(BigInt(mulDivHalfUp(big, 2999, 10_000))).toBe(exact);
    expect(mulDivHalfUp(big, 10_000, 10_000)).toBe(big);
  });
});
