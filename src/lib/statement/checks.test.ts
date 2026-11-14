import { describe, expect, it } from "vitest";
import type { CardAccount } from "@/lib/types";
import { checkCard } from "./checks";

/** A card whose numbers agree with each other: $8,400 at 27.24% is $190.68 of interest a month. */
function card(overrides: Partial<CardAccount> = {}): CardAccount {
  return {
    id: "card-1",
    issuer: "chase",
    issuerName: "Chase",
    cardName: "Freedom Unlimited",
    last4: "4417",
    balanceCents: 840_000,
    creditLimitCents: 1_000_000,
    purchaseAprBps: 2724,
    penaltyAprBps: null,
    promo: null,
    minimumPaymentCents: 27_468,
    annualFeeCents: 0,
    lateFeeCents: 0,
    interestChargedCents: 19_068,
    statementDate: "2026-11-06",
    dueDate: "2026-12-01",
    memberSinceYear: 2020,
    latePaymentsLast12m: 0,
    ...overrides,
  };
}

const warnedFields = (overrides: Partial<CardAccount>) => checkCard(card(overrides)).map((warning) => warning.field);

describe("checkCard", () => {
  it("says nothing about a card whose numbers agree", () => {
    expect(checkCard(card())).toEqual([]);
  });

  it("warns about an APR above 40% and accepts 40% itself", () => {
    expect(warnedFields({ purchaseAprBps: 4001, interestChargedCents: null })).toEqual(["purchaseAprBps"]);
    expect(warnedFields({ purchaseAprBps: 4000, interestChargedCents: null })).toEqual([]);
  });

  it("checks the penalty and promotional rates against the same range", () => {
    expect(warnedFields({ penaltyAprBps: 9999 })).toEqual(["penaltyAprBps"]);
    expect(warnedFields({ promo: { aprBps: 5000, endsOn: "2027-01-01" }, interestChargedCents: null })).toEqual(["promo"]);
  });

  it("allows a balance a little over the limit and warns past 5%", () => {
    expect(warnedFields({ creditLimitCents: 810_000 })).toEqual([]);
    expect(warnedFields({ creditLimitCents: 790_000 })).toEqual(["creditLimitCents"]);
    expect(warnedFields({ creditLimitCents: null })).toEqual([]);
  });

  it("accepts printed interest near balance x APR / 12 and warns when it is far off", () => {
    // A 31-day cycle on a slightly different average balance.
    expect(warnedFields({ interestChargedCents: 19_690 })).toEqual([]);
    expect(warnedFields({ interestChargedCents: 9000 })).toEqual(["interestChargedCents"]);
    expect(warnedFields({ interestChargedCents: 40_000 })).toEqual(["interestChargedCents"]);
  });

  it("names both figures in the interest warning", () => {
    const [warning] = checkCard(card({ interestChargedCents: 9000 }));
    expect(warning.message).toContain("$90.00");
    expect(warning.message).toContain("27.24%");
    expect(warning.message).toContain("$190.68");
  });

  it("compares interest with the promotional rate while one is running", () => {
    const promo = { aprBps: 0, endsOn: "2026-12-25" };
    expect(warnedFields({ promo, interestChargedCents: 0 })).toEqual([]);
    expect(warnedFields({ promo, interestChargedCents: 19_068 })).toEqual(["interestChargedCents"]);
  });

  it("does not flag a few dollars of difference on a small balance", () => {
    expect(warnedFields({ balanceCents: 10_000, interestChargedCents: 600, minimumPaymentCents: 2500 })).toEqual([]);
  });

  it("warns when the minimum payment is larger than the balance", () => {
    expect(warnedFields({ minimumPaymentCents: 900_000 })).toEqual(["minimumPaymentCents"]);
  });

  it("warns when the dates are out of order", () => {
    expect(warnedFields({ dueDate: "2026-10-01" })).toEqual(["dueDate"]);
    expect(warnedFields({ promo: { aprBps: 2724, endsOn: "2026-01-01" } })).toEqual(["promo"]);
  });
});
