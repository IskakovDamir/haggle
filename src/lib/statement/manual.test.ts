import { describe, expect, it } from "vitest";
import { extractionFromManual } from "./manual";

describe("extractionFromManual", () => {
  it("builds a card from the three numbers a visitor must type", () => {
    const { card, warnings, source, holderFirstName } = extractionFromManual(
      { issuerName: "Chase", balance: "8400", purchaseApr: "27.24" },
      "card-1",
    );
    expect(source).toBe("manual");
    expect(warnings).toEqual([]);
    expect(holderFirstName).toBeNull();
    expect(card).toMatchObject({
      id: "card-1",
      issuer: "chase",
      balanceCents: 840_000,
      purchaseAprBps: 2724,
      creditLimitCents: null,
      annualFeeCents: 0,
      lateFeeCents: 0,
      memberSinceYear: null,
    });
  });

  it("reads the optional fields the same way a statement is read", () => {
    const { card, holderFirstName, warnings } = extractionFromManual({
      issuerName: "Capital One",
      balance: "$3,100.00",
      purchaseApr: "29.99%",
      holderFirstName: "maria",
      cardName: "Quicksilver",
      last4: "8062",
      creditLimit: "$4,000",
      minimumPayment: "108.47",
      annualFee: "95",
      lateFee: " ",
      memberSinceYear: "2021",
      latePaymentsLast12m: "0",
    });
    expect(warnings).toEqual([]);
    expect(holderFirstName).toBe("maria");
    expect(card).toMatchObject({
      issuer: "capital_one",
      cardName: "Quicksilver",
      last4: "8062",
      creditLimitCents: 400_000,
      minimumPaymentCents: 10_847,
      annualFeeCents: 9500,
      lateFeeCents: 0,
      memberSinceYear: 2021,
      latePaymentsLast12m: 0,
    });
  });

  it("warns on the field instead of throwing when something typed is not a number", () => {
    const { warnings } = extractionFromManual({
      issuerName: "",
      balance: "lots",
      purchaseApr: "55",
      memberSinceYear: "last year",
    });
    expect(warnings.map((warning) => warning.field).sort()).toEqual([
      "balanceCents",
      "issuerName",
      "memberSinceYear",
      "purchaseAprBps",
    ]);
  });

  it("gives every card its own id", () => {
    const entry = { issuerName: "Citi", balance: "5250", purchaseApr: "26.49" };
    expect(extractionFromManual(entry).card.id).not.toBe(extractionFromManual(entry).card.id);
  });
});
