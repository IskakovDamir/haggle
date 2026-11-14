import { afterEach, describe, expect, it, vi } from "vitest";
import type { Analysis, CardAccount, LeverKind } from "@/lib/types";
import { PUBLISHED_FIGURES, analyze } from "./index";
import { card, mariaCapitalOne, mariaChase } from "./test-cards";

const TODAY = "2026-11-14";

function leverOf(analysis: Analysis, cardId: string, kind: LeverKind) {
  const lever = analysis.levers.find((each) => each.cardId === cardId && each.kind === kind);
  if (!lever) throw new Error(`no ${kind} lever for ${cardId}`);
  return lever;
}

const onlyLever = (one: CardAccount, kind: LeverKind) => leverOf(analyze([one], TODAY), one.id, kind);

describe("analyze: Maria's two cards", () => {
  const analysis = analyze([mariaChase, mariaCapitalOne], TODAY);

  it("says what each card costs", () => {
    expect(analysis.cards).toEqual([
      {
        cardId: "chase",
        annualInterestCents: 228_816,
        minimumOnly: { months: 292, totalInterestCents: 1_788_749, totalPaidCents: 2_628_749, paidOff: true },
        utilizationPct: 84,
        promoEndsInDays: null,
      },
      {
        cardId: "capital-one",
        annualInterestCents: 92_969,
        minimumOnly: { months: 197, totalInterestCents: 651_599, totalPaidCents: 961_599, paidOff: true },
        utilizationPct: 77.5,
        promoEndsInDays: null,
      },
    ]);
  });

  it("adds the cards up", () => {
    expect(analysis.totals).toEqual({
      balanceCents: 1_150_000,
      annualInterestCents: 321_785,
      // $11,500 of $14,000
      utilizationPct: 82.1,
      // $529.20 + $195.30 from lower APRs and the $95.00 fee. The transfers are not added on top.
      potentialAnnualCents: 81_950,
    });
  });

  it("values every lever to the cent", () => {
    // The APR values follow from PUBLISHED_FIGURES.expectedAprCutBps (630). If a fact check changes
    // that figure, these two lines and the sentences below change with it.
    const values = analysis.levers.map((lever) => [`${lever.cardId}:${lever.kind}`, lever.eligible, lever.potentialAnnualCents]);
    expect(values).toEqual([
      ["chase:apr_reduction", true, 52_920],
      ["chase:annual_fee_waiver", false, 0],
      ["chase:late_fee_refund", false, 0],
      ["chase:penalty_apr_review", false, 0],
      ["chase:credit_limit_increase", true, 0],
      // $2,288.16 of interest minus a $252.00 transfer fee
      ["chase:balance_transfer", true, 203_616],
      ["capital-one:apr_reduction", true, 19_530],
      ["capital-one:annual_fee_waiver", true, 9_500],
      ["capital-one:late_fee_refund", false, 0],
      ["capital-one:penalty_apr_review", false, 0],
      ["capital-one:credit_limit_increase", true, 0],
      // $929.69 of interest minus a $93.00 transfer fee
      ["capital-one:balance_transfer", true, 83_669],
    ]);
  });

  it("writes the APR lever in plain sentences with the numbers", () => {
    expect(leverOf(analysis, "chase", "apr_reduction")).toEqual({
      kind: "apr_reduction",
      cardId: "chase",
      title: "Ask Chase to lower your APR",
      why: "At 27.24% this balance costs about $2,288 a year in interest. Cardholders who ask get an average cut of 6.3 points, worth about $529 a year here.",
      potentialAnnualCents: 52_920,
      successRatePct: PUBLISHED_FIGURES.successRatePct.apr_reduction,
      source: PUBLISHED_FIGURES.source,
      needsCall: true,
      eligible: true,
      ineligibleReason: null,
    });
  });

  it("writes the annual fee lever with the fee in it", () => {
    const lever = leverOf(analysis, "capital-one", "annual_fee_waiver");
    expect(lever.title).toBe("Ask Capital One to waive the $95 annual fee");
    expect(lever.why).toBe("This card charges a $95 annual fee. A full waiver is worth $95 a year.");
    expect(lever.successRatePct).toBe(PUBLISHED_FIGURES.successRatePct.annual_fee_waiver);
    expect(lever.source).toEqual(PUBLISHED_FIGURES.source);
  });

  it("states utilization now and after a 25% higher limit", () => {
    expect(leverOf(analysis, "chase", "credit_limit_increase").why).toBe(
      "You are using 84% of this card's $10,000 limit. With a 25% higher limit ($12,500) the same balance would use 67.2%, which usually helps a credit score.",
    );
    expect(leverOf(analysis, "capital-one", "credit_limit_increase").why).toBe(
      "You are using 77.5% of this card's $4,000 limit. With a 25% higher limit ($5,000) the same balance would use 62%, which usually helps a credit score.",
    );
  });

  it("says a balance transfer needs no call and usually needs good credit", () => {
    const lever = leverOf(analysis, "chase", "balance_transfer");
    expect(lever.needsCall).toBe(false);
    expect(lever.title).toBe("Move your Chase balance to a 0% transfer card");
    expect(lever.why).toBe(
      "A 0% transfer card would stop about $2,288 a year in interest on this balance. After a 3% transfer fee ($252) that leaves about $2,036 in the first year. It usually needs good credit.",
    );
  });

  it("attaches a success rate and a source only where one is published", () => {
    for (const lever of analysis.levers) {
      const published = lever.eligible && (lever.kind === "apr_reduction" || lever.kind === "annual_fee_waiver");
      expect(lever.successRatePct === null, `${lever.cardId}:${lever.kind}`).toBe(!published);
      expect(lever.source === null, `${lever.cardId}:${lever.kind}`).toBe(!published);
    }
  });

  it("explains every lever that does not apply", () => {
    expect(leverOf(analysis, "chase", "annual_fee_waiver").ineligibleReason).toBe("This card has no annual fee.");
    expect(leverOf(analysis, "chase", "late_fee_refund").ineligibleReason).toBe("There is no late fee on this statement.");
    expect(leverOf(analysis, "chase", "penalty_apr_review").ineligibleReason).toBe(
      "The statement does not show a penalty APR.",
    );
  });

  it("orders the plan: APR calls, the fee, the limit increases, then the transfers", () => {
    expect(analysis.plan.map((step) => [step.order, step.id, step.dueOn])).toEqual([
      [1, "chase:apr_reduction", null],
      [2, "capital-one:apr_reduction", null],
      [3, "capital-one:annual_fee_waiver", null],
      // 30 days after November 14
      [4, "chase:credit_limit_increase", "2026-12-14"],
      [5, "capital-one:credit_limit_increase", "2026-12-14"],
      // 60 days after November 14
      [6, "chase:balance_transfer", "2027-01-13"],
      [7, "capital-one:balance_transfer", "2027-01-13"],
    ]);
  });

  it("puts only eligible levers in the plan, and the same lever objects", () => {
    for (const step of analysis.plan) {
      expect(step.lever.eligible).toBe(true);
      expect(step.lever).toBe(leverOf(analysis, step.lever.cardId, step.lever.kind));
    }
  });

  it("moves the dates with today", () => {
    const later = analyze([mariaChase, mariaCapitalOne], "2027-02-01");
    expect(later.plan.map((step) => step.dueOn)).toEqual([
      null,
      null,
      null,
      "2027-03-03",
      "2027-03-03",
      "2027-04-02",
      "2027-04-02",
    ]);
  });

  it("states the assumptions behind the numbers", () => {
    expect(analysis.assumptions).toEqual([
      "Yearly interest assumes the balance stays where it is today for 12 months.",
      "Minimum payments are estimated as 1% of the balance plus that month's interest, and at least $25. Your bank's formula may differ a little.",
      "The value of a lower APR uses the average cut for cardholders who asked, 6.3 points (LendingTree, 2026). Your result can be higher or lower.",
      "A balance transfer is valued as 12 months at 0% minus a 3% transfer fee.",
      "The total counts only what a call can win. A balance transfer is not added on top, because it would save the same interest twice.",
    ]);
  });
});

describe("analyze: a card with every lever", () => {
  const everything = card({
    id: "all",
    issuerName: "Test Bank",
    balanceCents: 500_000,
    creditLimitCents: 600_000,
    purchaseAprBps: 2999,
    penaltyAprBps: 2999,
    annualFeeCents: 9_500,
    lateFeeCents: 4_000,
  });
  const analysis = analyze([everything], TODAY);

  it("SPEC plan order: APR, annual fee, late fee, penalty review, limit increase, balance transfer", () => {
    expect(analysis.plan.map((step) => [step.order, step.id, step.dueOn])).toEqual([
      [1, "all:apr_reduction", null],
      [2, "all:annual_fee_waiver", null],
      [3, "all:late_fee_refund", null],
      [4, "all:penalty_apr_review", null],
      [5, "all:credit_limit_increase", "2026-12-14"],
      [6, "all:balance_transfer", "2027-01-13"],
    ]);
  });

  it("values the late fee at the fee, with no published success rate", () => {
    const lever = leverOf(analysis, "all", "late_fee_refund");
    expect(lever).toMatchObject({
      title: "Ask Test Bank to refund the $40 late fee",
      why: "This statement shows a $40 late fee. A refund puts that $40 back.",
      potentialAnnualCents: 4_000,
      successRatePct: null,
      source: null,
      needsCall: true,
      eligible: true,
    });
  });

  it("asks for a penalty APR review when the purchase APR is at the penalty rate, worth no fixed amount", () => {
    const lever = leverOf(analysis, "all", "penalty_apr_review");
    expect(lever).toMatchObject({ eligible: true, potentialAnnualCents: 0, needsCall: true, successRatePct: null });
    expect(lever.why).toBe(
      "Your 29.99% APR is at or above this card's penalty rate of 29.99%, so you may be paying the penalty rate. Ask the bank to review it and move you back to the regular rate.",
    );
  });

  it("totals the calls worth money: $315.00 APR cut, $95.00 fee, $40.00 late fee", () => {
    expect(analysis.totals.potentialAnnualCents).toBe(31_500 + 9_500 + 4_000);
  });
});

describe("analyze: edge cases", () => {
  it("no cards: empty lists, zero totals, unknown utilization", () => {
    const analysis = analyze([], TODAY);
    expect(analysis.cards).toEqual([]);
    expect(analysis.levers).toEqual([]);
    expect(analysis.plan).toEqual([]);
    expect(analysis.totals).toEqual({
      balanceCents: 0,
      annualInterestCents: 0,
      utilizationPct: null,
      potentialAnnualCents: 0,
    });
  });

  it("zero balance: nothing to ask for, and the levers say why", () => {
    const paidOff = card({ id: "zero", creditLimitCents: 500_000, purchaseAprBps: 2724 });
    const analysis = analyze([paidOff], TODAY);
    expect(analysis.cards[0]).toEqual({
      cardId: "zero",
      annualInterestCents: 0,
      minimumOnly: { months: 0, totalInterestCents: 0, totalPaidCents: 0, paidOff: true },
      utilizationPct: 0,
      promoEndsInDays: null,
    });
    expect(analysis.plan).toEqual([]);
    expect(analysis.totals.potentialAnnualCents).toBe(0);
    expect(leverOf(analysis, "zero", "apr_reduction").ineligibleReason).toBe(
      "There is no balance on this card, so a lower rate would not save anything.",
    );
    expect(leverOf(analysis, "zero", "credit_limit_increase").ineligibleReason).toBe(
      "You are using 0% of this card's limit, which is already under 30%.",
    );
    expect(leverOf(analysis, "zero", "balance_transfer").ineligibleReason).toBe(
      "The balance is under $1,000, so a transfer would save too little to be worth it.",
    );
  });

  it("0% APR: no interest, no APR ask, no transfer", () => {
    const interestFree = card({ id: "free", balanceCents: 500_000, purchaseAprBps: 0 });
    const analysis = analyze([interestFree], TODAY);
    expect(analysis.cards[0].annualInterestCents).toBe(0);
    expect(analysis.cards[0].minimumOnly).toMatchObject({ totalInterestCents: 0, totalPaidCents: 500_000, paidOff: true });
    expect(leverOf(analysis, "free", "apr_reduction").ineligibleReason).toBe("This card's APR is already 0%.");
    expect(leverOf(analysis, "free", "balance_transfer").ineligibleReason).toBe(
      "At 0.00% a transfer would save too little to be worth it.",
    );
    expect(analysis.plan).toEqual([]);
  });

  it("unknown limit: utilization is unknown and a limit increase is not suggested", () => {
    const noLimit = { ...mariaChase, id: "no-limit", creditLimitCents: null };
    const analysis = analyze([noLimit, mariaCapitalOne], TODAY);
    expect(analysis.cards[0].utilizationPct).toBeNull();
    expect(analysis.cards[1].utilizationPct).toBe(77.5);
    // One unknown limit makes the overall figure unknown too.
    expect(analysis.totals.utilizationPct).toBeNull();
    const lever = leverOf(analysis, "no-limit", "credit_limit_increase");
    expect(lever.eligible).toBe(false);
    expect(lever.ineligibleReason).toBe(
      "We do not know this card's credit limit, so we cannot tell if a higher one would help.",
    );
    expect(analysis.plan.map((step) => step.id)).not.toContain("no-limit:credit_limit_increase");
  });

  it("a limit increase starts at 30% utilization", () => {
    const at = (balanceCents: number) => onlyLever(card({ balanceCents, creditLimitCents: 100_000 }), "credit_limit_increase");
    expect(at(30_000).eligible).toBe(true);
    expect(at(29_900).eligible).toBe(false);
    expect(at(29_900).ineligibleReason).toBe("You are using 29.9% of this card's limit, which is already under 30%.");
  });

  it("a balance transfer starts at $1,000 and 15% APR", () => {
    const at = (balanceCents: number, purchaseAprBps: number) =>
      onlyLever(card({ balanceCents, purchaseAprBps }), "balance_transfer");
    // $150.00 of interest minus a $30.00 fee
    expect(at(100_000, 1500)).toMatchObject({ eligible: true, potentialAnnualCents: 12_000 });
    expect(at(99_999, 1500).eligible).toBe(false);
    expect(at(100_000, 1499).eligible).toBe(false);
    expect(at(100_000, 1499).ineligibleReason).toBe("At 14.99% a transfer would save too little to be worth it.");
  });

  it("a penalty APR review is not suggested below the penalty rate", () => {
    const below = onlyLever(card({ balanceCents: 100_000, purchaseAprBps: 2724, penaltyAprBps: 2999 }), "penalty_apr_review");
    expect(below.eligible).toBe(false);
    expect(below.ineligibleReason).toBe("Your 27.24% APR is below this card's penalty rate of 29.99%.");
    const above = onlyLever(card({ balanceCents: 100_000, purchaseAprBps: 3124, penaltyAprBps: 2999 }), "penalty_apr_review");
    expect(above.eligible).toBe(true);
  });

  it("an APR cut is never valued above the interest itself", () => {
    // At 4% the average 6.3 point cut cannot happen in full. The most a lower rate can save is the $40 of interest.
    const lever = onlyLever(card({ balanceCents: 100_000, purchaseAprBps: 400 }), "apr_reduction");
    expect(lever.potentialAnnualCents).toBe(4_000);
    expect(lever.why).toBe(
      "At 4.00% this balance costs about $40 a year in interest. Cardholders who ask get an average cut of 6.3 points. Here a lower rate can save at most about $40 a year.",
    );
  });

  it("a card with no issuer name still reads as a sentence", () => {
    const nameless = card({ issuerName: "  ", balanceCents: 200_000, purchaseAprBps: 2400 });
    expect(onlyLever(nameless, "apr_reduction").title).toBe("Ask your bank to lower your APR");
    expect(onlyLever(nameless, "balance_transfer").title).toBe("Move this balance to a 0% transfer card");
  });

  it("within one kind, the bigger win comes first", () => {
    const small = card({ id: "small", balanceCents: 100_000, purchaseAprBps: 2400 });
    const large = card({ id: "large", balanceCents: 900_000, purchaseAprBps: 2400 });
    const ids = analyze([small, large], TODAY).plan.map((step) => step.id);
    expect(ids).toEqual(["large:apr_reduction", "small:apr_reduction", "large:balance_transfer", "small:balance_transfer"]);
  });
});

describe("analyze: a promo rate", () => {
  const withPromoEnding = (endsOn: string) =>
    card({ id: "promo", issuerName: "Citi", balanceCents: 500_000, purchaseAprBps: 2499, promo: { aprBps: 0, endsOn } });
  const transferDueOn = (endsOn: string) =>
    analyze([withPromoEnding(endsOn)], TODAY).plan.find((step) => step.id === "promo:balance_transfer")?.dueOn;

  it("ending in 45 days: the transfer is due 30 days before it ends", () => {
    const analysis = analyze([withPromoEnding("2026-12-29")], TODAY);
    expect(analysis.cards[0].promoEndsInDays).toBe(45);
    // 15 days from today, which is sooner than the usual 60.
    expect(transferDueOn("2026-12-29")).toBe("2026-11-29");
  });

  it("ending within 30 days: the transfer is due today, never in the past", () => {
    expect(transferDueOn("2026-11-24")).toBe(TODAY);
    expect(transferDueOn(TODAY)).toBe(TODAY);
  });

  it("ending far away: the usual 60 days", () => {
    expect(transferDueOn("2027-06-02")).toBe("2027-01-13");
    // Exactly 90 days out, both rules give the same day.
    expect(transferDueOn("2027-02-12")).toBe("2027-01-13");
  });

  it("already over: treated as no promo", () => {
    const analysis = analyze([withPromoEnding("2026-11-13")], TODAY);
    expect(analysis.cards[0].promoEndsInDays).toBeNull();
    expect(transferDueOn("2026-11-13")).toBe("2027-01-13");
    expect(analysis.assumptions).toHaveLength(5);
  });

  it("says which rate the numbers use", () => {
    const analysis = analyze([withPromoEnding("2026-12-29")], TODAY);
    expect(analysis.assumptions.at(-1)).toBe(
      "The Citi card has a 0.00% promo rate until Dec 29, 2026. Its numbers use the regular 24.99% rate that follows.",
    );
  });
});

describe("analyze: purity", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("does not change the cards it is given", () => {
    const cards = [Object.freeze({ ...mariaChase }), Object.freeze({ ...mariaCapitalOne })];
    const before = JSON.stringify(cards);
    analyze(Object.freeze(cards) as CardAccount[], TODAY);
    expect(JSON.stringify(cards)).toBe(before);
  });

  it("depends on the today it is given, not on the clock", () => {
    const expected = analyze([mariaChase, mariaCapitalOne], TODAY);
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2031-05-05T05:05:05Z"));
    expect(analyze([mariaChase, mariaCapitalOne], TODAY)).toEqual(expected);
  });
});
