import { describe, expect, it } from "vitest";
import { buildBrief } from "@/lib/negotiator";
import { askSentence, cardLabel, goalLabel } from "./ask";
import { testCard, testStep } from "./test-fixtures";

describe("cardLabel", () => {
  it("names the issuer, the card and the last four digits", () => {
    expect(cardLabel(testCard())).toBe("Chase Freedom Unlimited ending 4821");
  });

  it("does not repeat an issuer that is already in the card name", () => {
    const card = testCard({ issuerName: "Capital One", cardName: "Capital One Quicksilver", last4: null });
    expect(cardLabel(card)).toBe("Capital One Quicksilver");
  });
});

describe("askSentence", () => {
  it("states the APR ask with the numbers from the brief", () => {
    const card = testCard();
    const brief = buildBrief({ card, holderFirstName: "Maria", lever: testStep().lever });
    expect(askSentence(brief, card)).toBe(
      "Lower the APR from 27.24% to 17.24%. Anything at 25.24% or lower counts as a win.",
    );
  });

  it("states the fee for a waiver", () => {
    const card = testCard({ annualFeeCents: 9500 });
    const brief = buildBrief({ card, holderFirstName: "Maria", lever: testStep({ kind: "annual_fee_waiver" }).lever });
    expect(askSentence(brief, card)).toBe("Waive the $95 annual fee.");
  });
});

describe("goalLabel", () => {
  it("has a short name for each kind of call", () => {
    expect(goalLabel("apr_reduction")).toBe("Lower APR");
    expect(goalLabel("credit_limit_increase")).toBe("Higher credit limit");
  });

  it("has a Spanish name for each kind of call", () => {
    expect(goalLabel("apr_reduction", "es")).toBe("APR más bajo");
    expect(goalLabel("missed_payment", "es")).toBe("Perdón del pago atrasado");
  });
});

describe("askSentence in Spanish", () => {
  it("keeps the numbers from the brief", () => {
    const card = testCard();
    const brief = buildBrief({ card, holderFirstName: "Maria", lever: testStep().lever });
    expect(askSentence(brief, card, "es")).toBe(
      "Bajar el APR de 27.24% a 17.24%. Cualquier tasa de 25.24% o menos cuenta como victoria.",
    );
  });

  it("lists the missed-payment asks", () => {
    const card = testCard({
      lateFeeCents: 4000,
      purchaseAprBps: 2999,
      missedPayment: { reason: "forgot", note: "", daysLate: 9, paidSince: true, firstInYear: true, aprBeforeBps: 2724 },
    });
    const brief = buildBrief({ card, holderFirstName: "Maria", lever: testStep({ kind: "missed_payment" }).lever });
    const english = askSentence(brief, card);
    const spanish = askSentence(brief, card, "es");
    expect(spanish.startsWith("Como cortesía por única vez: ")).toBe(true);
    expect(spanish).toContain("$40");
    // Every figure in the English sentence is in the Spanish one.
    for (const figure of english.match(/\$[\d,.]+|\d+\.\d+%/g) ?? []) expect(spanish).toContain(figure);
  });

  it("states the fee for a waiver", () => {
    const card = testCard({ annualFeeCents: 9500 });
    const brief = buildBrief({ card, holderFirstName: "Maria", lever: testStep({ kind: "annual_fee_waiver" }).lever });
    expect(askSentence(brief, card, "es")).toBe("Eliminar la cuota anual de $95.");
  });
});

describe("cardLabel in Spanish", () => {
  it("says terminada en", () => {
    expect(cardLabel(testCard(), "es")).toBe("Chase Freedom Unlimited terminada en 4821");
  });

  it("drops the generic card name from the missed-payment form", () => {
    expect(cardLabel(testCard({ cardName: "Credit card", last4: "4417" }), "es")).toBe("Chase terminada en 4417");
  });
});
