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
});
