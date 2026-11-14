import { describe, expect, it } from "vitest";
import type { ExtractionWarning } from "@/lib/types";
import {
  EMPTY_READING,
  STATEMENT_JSON_SCHEMA,
  statementReadingSchema,
  toExtraction,
  type StatementReading,
} from "./schema";

/** What a careful reader copies from a statement like Maria's. */
const CHASE_READING: StatementReading = {
  isCreditCardStatement: true,
  issuerName: "Chase",
  cardName: "Freedom Unlimited",
  cardholderName: "MARIA LOPEZ",
  accountEnding: "4417",
  newBalance: "$8,400.00",
  creditLimit: "$10,000.00",
  purchaseApr: "27.24% (v)",
  penaltyApr: null,
  promoApr: null,
  promoEndsOn: null,
  minimumPaymentDue: "$274.68",
  annualFee: "$0.00",
  lateFeeCharged: null,
  interestCharged: "$190.68",
  statementClosingDate: "2026-11-06",
  paymentDueDate: "2026-12-01",
  memberSinceYear: "2020",
  latePaymentsLast12Months: "0",
};

const read = (overrides: Partial<StatementReading> = {}) =>
  toExtraction({ ...CHASE_READING, ...overrides }, { id: "card-1", source: "upload" });

const warningsOn = (warnings: ExtractionWarning[], field: ExtractionWarning["field"]) =>
  warnings.filter((warning) => warning.field === field);

describe("STATEMENT_JSON_SCHEMA", () => {
  const properties: Record<string, { type: unknown }> = STATEMENT_JSON_SCHEMA.properties;

  it("requires every property and allows no others, as structured output demands", () => {
    expect(STATEMENT_JSON_SCHEMA.additionalProperties).toBe(false);
    expect([...STATEMENT_JSON_SCHEMA.required].sort()).toEqual(Object.keys(properties).sort());
  });

  it("asks for the same fields the zod schema validates", () => {
    expect(Object.keys(properties).sort()).toEqual(Object.keys(statementReadingSchema.shape).sort());
  });

  it("uses no nullable or union types, which the API caps at 16 per schema", () => {
    for (const property of Object.values(properties)) {
      expect(typeof property.type).toBe("string");
      expect(property).not.toHaveProperty("anyOf");
    }
  });
});

describe("statementReadingSchema", () => {
  const answer = { ...CHASE_READING, penaltyApr: "", promoApr: "  ", promoEndsOn: "", lateFeeCharged: "" };

  it("turns the empty string the model writes for 'not printed' into null", () => {
    const reading = statementReadingSchema.parse(answer);
    expect(reading.penaltyApr).toBeNull();
    expect(reading.promoApr).toBeNull();
    expect(reading.newBalance).toBe("$8,400.00");
  });

  it("rejects an answer with a missing field, an extra field or a wrong type", () => {
    const withoutBalance: Record<string, unknown> = { ...answer };
    delete withoutBalance.newBalance;
    expect(statementReadingSchema.safeParse(withoutBalance).success).toBe(false);
    expect(statementReadingSchema.safeParse({ ...answer, cardNumber: "4111111111111111" }).success).toBe(false);
    expect(statementReadingSchema.safeParse({ ...answer, newBalance: 8400 }).success).toBe(false);
    expect(statementReadingSchema.safeParse({ ...answer, cardName: "x".repeat(500) }).success).toBe(false);
  });
});

describe("toExtraction", () => {
  it("converts printed text to cents, basis points and dates without a warning", () => {
    const extraction = read();
    expect(extraction.warnings).toEqual([]);
    expect(extraction.holderFirstName).toBe("Maria");
    expect(extraction.source).toBe("upload");
    expect(extraction.card).toEqual({
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
    });
  });

  it("keeps a promotional rate with its end date, and the fees charged", () => {
    const { card, warnings } = read({
      issuerName: "Citi",
      purchaseApr: "26.49%",
      promoApr: "0.00%",
      promoEndsOn: "2026-12-25",
      interestCharged: "$0.00",
      lateFeeCharged: "$41.00",
      annualFee: "$95.00",
    });
    expect(warnings).toEqual([]);
    expect(card.issuer).toBe("citi");
    expect(card.promo).toEqual({ aprBps: 0, endsOn: "2026-12-25" });
    expect(card.purchaseAprBps).toBe(2649);
    expect(card.lateFeeCents).toBe(4100);
    expect(card.annualFeeCents).toBe(9500);
  });

  it("warns on the field when the balance or the APR was not found", () => {
    const { card, warnings } = read({ newBalance: null, purchaseApr: null });
    expect(warningsOn(warnings, "balanceCents")).toHaveLength(1);
    expect(warningsOn(warnings, "purchaseAprBps")).toHaveLength(1);
    expect(card.balanceCents).toBe(0);
    expect(card.purchaseAprBps).toBe(0);
    // With nothing to compare, the cross-checks stay quiet instead of piling on.
    expect(warnings).toHaveLength(2);
  });

  it("does not compare the printed interest with a rate it never found", () => {
    const { warnings } = read({ purchaseApr: null });
    expect(warningsOn(warnings, "interestChargedCents")).toEqual([]);
  });

  it("still checks the dates and the limit when the balance could not be read", () => {
    const { warnings } = read({ newBalance: "unclear", paymentDueDate: "2026-10-01" });
    expect(warnings.map((warning) => warning.field).sort()).toEqual(["balanceCents", "dueDate"]);
  });

  it("warns instead of guessing when printed text is not a plain number or date", () => {
    const { card, warnings } = read({
      creditLimit: "ten thousand",
      paymentDueDate: "12/01/2026",
      minimumPaymentDue: "see page 2",
      memberSinceYear: "a while",
    });
    expect(card.creditLimitCents).toBeNull();
    expect(card.dueDate).toBeNull();
    expect(card.minimumPaymentCents).toBeNull();
    expect(card.memberSinceYear).toBeNull();
    expect(warnings.map((warning) => warning.field).sort()).toEqual([
      "creditLimitCents",
      "dueDate",
      "memberSinceYear",
      "minimumPaymentCents",
    ]);
  });

  it("warns about an APR outside 0 to 40%", () => {
    const { card, warnings } = read({ purchaseApr: "272.4%", interestCharged: null });
    expect(card.purchaseAprBps).toBe(27_240);
    expect(warningsOn(warnings, "purchaseAprBps")).toHaveLength(1);
  });

  it("warns when the balance is well above the limit", () => {
    const { warnings } = read({ creditLimit: "$1,000.00" });
    expect(warningsOn(warnings, "creditLimitCents")).toHaveLength(1);
  });

  it("warns, and does not block, when printed interest does not match balance x APR / 12", () => {
    const { card, warnings } = read({ interestCharged: "$19.06" });
    expect(card.interestChargedCents).toBe(1906);
    expect(warningsOn(warnings, "interestChargedCents")).toHaveLength(1);
  });

  it("warns when the due date is before the statement date", () => {
    const { warnings } = read({ paymentDueDate: "2026-10-01" });
    expect(warningsOn(warnings, "dueDate")).toHaveLength(1);
  });

  it("asks for the other half of a promotion when only one half was printed", () => {
    const rateOnly = read({ promoApr: "0%", interestCharged: null });
    expect(rateOnly.card.promo).toBeNull();
    expect(warningsOn(rateOnly.warnings, "promo")).toHaveLength(1);

    const dateOnly = read({ promoEndsOn: "2026-12-25" });
    expect(dateOnly.card.promo).toBeNull();
    expect(warningsOn(dateOnly.warnings, "promo")).toHaveLength(1);
  });

  it("treats a credit balance as no debt", () => {
    const { card, warnings } = read({ newBalance: "$25.00 CR", interestCharged: null, minimumPaymentDue: "$0.00" });
    expect(card.balanceCents).toBe(0);
    expect(warningsOn(warnings, "balanceCents")).toHaveLength(1);
  });

  it("drops a member-since year or a late-payment count that cannot be right", () => {
    const { card, warnings } = read({ memberSinceYear: "2031", latePaymentsLast12Months: "40" });
    expect(card.memberSinceYear).toBeNull();
    expect(card.latePaymentsLast12m).toBeNull();
    expect(warningsOn(warnings, "memberSinceYear")).toHaveLength(1);
    expect(warningsOn(warnings, "latePaymentsLast12m")).toHaveLength(1);
  });

  it("never lets more than the last four digits of a card number through", () => {
    const extraction = read({
      issuerName: "Chase 4111 1111 1111 4417",
      cardName: "Freedom Unlimited 4111111111114417",
      cardholderName: "MARIA LOPEZ 4111-1111-1111-4417",
      accountEnding: "4111 1111 1111 4417",
    });
    expect(extraction.card.last4).toBe("4417");
    expect(extraction.card.issuerName).toBe("Chase");
    expect(extraction.card.cardName).toBe("Freedom Unlimited");
    expect(extraction.holderFirstName).toBe("Maria");
    // Nothing in the whole result has the 13 or more digits of a card number.
    expect(JSON.stringify(extraction)).not.toMatch(/\d(?:[ -]?\d){12,}/);
  });

  it("builds an empty card, with warnings, from a reading with nothing in it", () => {
    const { card, warnings, holderFirstName } = toExtraction(EMPTY_READING, { id: "card-2", source: "manual" });
    expect(holderFirstName).toBeNull();
    expect(card.last4).toBeNull();
    expect(card.cardName).toBe("Credit card");
    expect(warnings.map((warning) => warning.field).sort()).toEqual(["balanceCents", "issuerName", "purchaseAprBps"]);
  });
});
