import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { annualInterestCents, monthlyInterestCents } from "./index";
import { aprBps, balanceCents } from "./test-arbitraries";

/** Any integer a caller could pass by mistake, including credit balances and negative rates. */
const anyInteger = fc.integer({ min: -1_000_000_000_000, max: 1_000_000_000_000 });

/** Balances far above anything a double can multiply exactly by an APR. */
const hugeBalanceCents = fc.integer({ min: 0, max: Number.MAX_SAFE_INTEGER });

describe("interest properties", () => {
  it("SPEC: interest is never negative, and always a whole number of cents", () => {
    fc.assert(
      fc.property(anyInteger, anyInteger, (balance, apr) => {
        for (const interest of [monthlyInterestCents(balance, apr), annualInterestCents(balance, apr)]) {
          expect(interest).toBeGreaterThanOrEqual(0);
          expect(Number.isInteger(interest)).toBe(true);
        }
      }),
    );
  });

  it("SPEC: a higher APR never costs less", () => {
    fc.assert(
      fc.property(balanceCents, aprBps, aprBps, (balance, a, b) => {
        const [lower, higher] = a <= b ? [a, b] : [b, a];
        expect(monthlyInterestCents(balance, higher)).toBeGreaterThanOrEqual(monthlyInterestCents(balance, lower));
        expect(annualInterestCents(balance, higher)).toBeGreaterThanOrEqual(annualInterestCents(balance, lower));
      }),
    );
  });

  it("a higher balance never costs less", () => {
    fc.assert(
      fc.property(balanceCents, balanceCents, aprBps, (a, b, apr) => {
        const [lower, higher] = a <= b ? [a, b] : [b, a];
        expect(monthlyInterestCents(higher, apr)).toBeGreaterThanOrEqual(monthlyInterestCents(lower, apr));
        expect(annualInterestCents(higher, apr)).toBeGreaterThanOrEqual(annualInterestCents(lower, apr));
      }),
    );
  });

  it("is the exact quotient rounded half up, even where floating point would drift", () => {
    // Half up means: exact - 0.5 < result <= exact + 0.5. Checked in integers, scaled by the divisor.
    const isHalfUp = (result: number, balance: number, apr: number, divisor: number) => {
      const error = BigInt(result) * BigInt(divisor) - BigInt(balance) * BigInt(apr);
      return error * BigInt(2) > BigInt(-divisor) && error * BigInt(2) <= BigInt(divisor);
    };
    fc.assert(
      fc.property(hugeBalanceCents, aprBps, (balance, apr) => {
        expect(isHalfUp(annualInterestCents(balance, apr), balance, apr, 10_000)).toBe(true);
        expect(isHalfUp(monthlyInterestCents(balance, apr), balance, apr, 120_000)).toBe(true);
      }),
    );
  });

  it("twelve months of interest is the yearly figure, give or take the rounding", () => {
    fc.assert(
      fc.property(balanceCents, aprBps, (balance, apr) => {
        const drift = Math.abs(12 * monthlyInterestCents(balance, apr) - annualInterestCents(balance, apr));
        expect(drift).toBeLessThanOrEqual(6);
      }),
    );
  });
});
