import { describe, expect, it } from "vitest";
import type { CardAccount, CaseFile, Extraction } from "@/lib/types";
import { cardAlreadyInCase, formValuesFrom, readCardForm, warningsToShow, type CardFormField } from "./card-form";

const TODAY = "2026-11-14";

const chase: CardAccount = {
  id: "card-1",
  issuer: "chase",
  issuerName: "Chase",
  cardName: "Freedom Unlimited",
  last4: "4417",
  balanceCents: 840_000,
  creditLimitCents: 1_000_000,
  purchaseAprBps: 2724,
  penaltyAprBps: 2999,
  promo: null,
  minimumPaymentCents: 27_468,
  annualFeeCents: 0,
  lateFeeCents: 0,
  interestChargedCents: 19_068,
  statementDate: "2026-11-01",
  dueDate: "2026-11-26",
  memberSinceYear: 2020,
  latePaymentsLast12m: 0,
};

const read = (card: CardAccount, warnings: Extraction["warnings"] = []): Extraction => ({
  card,
  holderFirstName: "Maria",
  warnings,
  source: "upload",
});

const none: ReadonlySet<CardFormField> = new Set();

describe("formValuesFrom and readCardForm", () => {
  it("gives back the same card when nothing is edited", () => {
    const result = readCardForm(formValuesFrom(read(chase)), chase, TODAY);
    expect(result.errors).toEqual({});
    expect(result.card).toEqual(chase);
    expect(result.holderFirstName).toBe("Maria");
  });

  it("round-trips a promo rate and its end date", () => {
    const promo: CardAccount = { ...chase, promo: { aprBps: 0, endsOn: "2026-12-25" } };
    expect(readCardForm(formValuesFrom(read(promo)), promo, TODAY).card).toEqual(promo);
  });

  it("stores typed dollars as cents and typed percentages as basis points", () => {
    const values = { ...formValuesFrom(read(chase)), balance: "$3,100", purchaseApr: "29.99%", annualFee: "95" };
    const { card } = readCardForm(values, chase, TODAY);
    expect(card).toMatchObject({ balanceCents: 310_000, purchaseAprBps: 2999, annualFeeCents: 9_500 });
  });

  it("works out the issuer again when the bank's name changes", () => {
    const values = { ...formValuesFrom(read(chase)), issuerName: "Capital One" };
    expect(readCardForm(values, chase, TODAY).card?.issuer).toBe("capital_one");
  });

  it("requires a first name, a bank, a balance and a rate", () => {
    const blank = { ...formValuesFrom(read(chase)), holderFirstName: " ", issuerName: "", balance: "", purchaseApr: "" };
    const result = readCardForm(blank, chase, TODAY);
    expect(result.card).toBeNull();
    expect(Object.keys(result.errors).sort()).toEqual(["balance", "holderFirstName", "issuerName", "purchaseApr"]);
  });

  it("treats blank optional fields as unknown, and blank fees as no fee", () => {
    const values = {
      ...formValuesFrom(read(chase)),
      creditLimit: "",
      penaltyApr: "",
      annualFee: "",
      lateFee: "",
      memberSinceYear: "",
      last4: "",
      cardName: "",
    };
    expect(readCardForm(values, chase, TODAY).card).toMatchObject({
      creditLimitCents: null,
      penaltyAprBps: null,
      annualFeeCents: 0,
      lateFeeCents: 0,
      memberSinceYear: null,
      last4: null,
      cardName: "Credit card",
    });
  });

  it("names the field that cannot be read", () => {
    const values = { ...formValuesFrom(read(chase)), creditLimit: "ten thousand", memberSinceYear: "2031" };
    const result = readCardForm(values, chase, TODAY);
    expect(result.card).toBeNull();
    expect(Object.keys(result.errors).sort()).toEqual(["creditLimit", "memberSinceYear"]);
  });

  it("asks for the other half of a promo", () => {
    const values = { ...formValuesFrom(read(chase)), promoApr: "0" };
    expect(readCardForm(values, chase, TODAY).errors).toEqual({ promoEndsOn: "Add the day the promo rate ends." });
    const dateOnly = { ...formValuesFrom(read(chase)), promoEndsOn: "2026-12-25" };
    expect(readCardForm(dateOnly, chase, TODAY).errors).toEqual({ promoApr: "Add the promo rate." });
  });

  it("starts a balance that was not read as a blank field, not as $0", () => {
    const unread = read({ ...chase, balanceCents: 0 }, [
      { field: "balanceCents", message: "We could not find the balance. Type it in." },
    ]);
    expect(formValuesFrom(unread).balance).toBe("");
    expect(formValuesFrom(read({ ...chase, balanceCents: 0 })).balance).toBe("0.00");
  });

  it("falls back to the first name already in the case", () => {
    expect(formValuesFrom({ ...read(chase), holderFirstName: null }, "Maria").holderFirstName).toBe("Maria");
  });
});

describe("warningsToShow", () => {
  const note = { field: "purchaseAprBps" as const, message: "We could not find the purchase APR. Type it in." };
  const aboutDocument = { field: "document" as const, message: "Only the first page was readable." };

  it("prints a note from the reading next to its field until that field is edited", () => {
    const extraction = read(chase, [note, aboutDocument]);
    expect(warningsToShow(extraction, chase, none)).toEqual({
      byField: { purchaseApr: [note.message] },
      general: [aboutDocument.message],
    });
    expect(warningsToShow(extraction, chase, new Set<CardFormField>(["purchaseApr"])).byField).toEqual({});
  });

  it("works the cross-checks out again from what is typed", () => {
    const overLimit: CardAccount = { ...chase, creditLimitCents: 500_000 };
    const asRead = warningsToShow(read(overLimit), overLimit, none);
    expect(asRead.byField.creditLimit).toHaveLength(1);

    // Fixing the limit clears the warning, although the balance field was never touched.
    expect(warningsToShow(read(overLimit), chase, new Set<CardFormField>(["creditLimit"])).byField).toEqual({});
  });

  it("does not print a cross-check twice when the reading already carried it", () => {
    const overLimit: CardAccount = { ...chase, creditLimitCents: 500_000 };
    const carried = warningsToShow(read(overLimit), overLimit, none).byField.creditLimit ?? [];
    const extraction = read(overLimit, [{ field: "creditLimitCents", message: carried[0] }]);
    expect(warningsToShow(extraction, overLimit, none).byField.creditLimit).toEqual(carried);
  });
});

describe("cardAlreadyInCase", () => {
  const caseFile: CaseFile = {
    version: 1,
    id: "case",
    createdAt: "2026-11-14T10:00:00.000Z",
    holderFirstName: "Maria",
    cards: [chase],
    calls: [],
  };

  it("finds the card by id", () => {
    expect(cardAlreadyInCase(caseFile, { ...chase, last4: null })).toBe(chase);
  });

  it("finds a newer statement for the same account by bank and last four digits", () => {
    expect(cardAlreadyInCase(caseFile, { ...chase, id: "card-2", issuerName: " chase " })).toBe(chase);
  });

  it("does not match another bank, another account, or a card with no digits", () => {
    expect(cardAlreadyInCase(caseFile, { ...chase, id: "card-2", issuerName: "Citi" })).toBeNull();
    expect(cardAlreadyInCase(caseFile, { ...chase, id: "card-2", last4: "9001" })).toBeNull();
    expect(cardAlreadyInCase(caseFile, { ...chase, id: "card-2", last4: null })).toBeNull();
    expect(cardAlreadyInCase(null, chase)).toBeNull();
  });
});
