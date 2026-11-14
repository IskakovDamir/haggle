import { describe, expect, it } from "vitest";
import { leversFor, savingsFromOutcome } from "@/lib/engine";
import { missedPaymentFacts } from "@/lib/missed";
import { buildBrief, openingLine, systemPrompt } from "@/lib/negotiator";
import { BLANK_MISSED, SAMPLE_MISSED, readMissedForm } from "./missed-model";

const read = (values = SAMPLE_MISSED) => readMissedForm(values, { id: "card-1", thisYear: 2026 });

function sampleCard() {
  const result = read();
  if (!result.ok) throw new Error(JSON.stringify(result.errors));
  return result.card;
}

describe("missed-payment form", () => {
  it("asks for the bank, the balance, the APR and the reason", () => {
    const result = read(BLANK_MISSED);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(Object.keys(result.errors).sort()).toEqual(["apr", "balance", "issuerName", "reason"]);
  });

  it("needs the old rate only when the rate went up, and it must be lower", () => {
    expect(read({ ...SAMPLE_MISSED, aprRaised: false, aprBefore: "" }).ok).toBe(true);
    const higher = read({ ...SAMPLE_MISSED, aprBefore: "31.00" });
    expect(higher.ok).toBe(false);
    if (!higher.ok) expect(higher.errors.aprBefore).toBeDefined();
  });

  it("refuses a card number in the note", () => {
    const result = read({ ...SAMPLE_MISSED, note: "my card 4111 1111 1111 1111 failed" });
    expect(result.ok).toBe(false);
  });

  it("builds a card with exact cents and the visitor's own account of the miss", () => {
    const card = sampleCard();
    expect(card).toMatchObject({ issuer: "chase", balanceCents: 840000, purchaseAprBps: 2999, lateFeeCents: 4000, last4: "4417" });
    expect(card.missedPayment).toMatchObject({ reason: "account_changed", daysLate: 9, paidSince: true, firstInYear: true, aprBeforeBps: 2724 });
  });
});

describe("missed-payment lever", () => {
  it("is first, worth the fee plus the raised rate, and takes over the late fee and penalty asks", () => {
    const levers = leversFor(sampleCard());
    expect(levers[0].kind).toBe("missed_payment");
    // $40 fee + $8,400 x 2.75 points = $40 + $231
    expect(levers[0]).toMatchObject({ eligible: true, potentialAnnualCents: 4000 + 23100 });
    for (const kind of ["late_fee_refund", "penalty_apr_review", "apr_reduction"]) {
      expect(levers.find((lever) => lever.kind === kind)?.eligible).toBe(false);
    }
  });

  it("does not apply to a card with no missed payment", () => {
    const card = { ...sampleCard(), missedPayment: null };
    expect(leversFor(card)[0]).toMatchObject({ kind: "missed_payment", eligible: false });
  });

  it("counts the old rate back and the fee as savings", () => {
    const savings = savingsFromOutcome(sampleCard(), {
      result: "won",
      aprAfterBps: 2724,
      annualFeeWaivedCents: null,
      lateFeeRefundCents: 4000,
      creditLimitAfterCents: null,
      statementCreditCents: null,
      followUp: null,
      evidence: [],
      verified: true,
    });
    expect(savings.annualSavingsCents).toBe(4000 + 23100);
  });
});

describe("missed-payment call", () => {
  const card = sampleCard();
  const lever = leversFor(card)[0];
  const brief = buildBrief({ card, holderFirstName: "Maria", lever });

  it("asks for the old rate and states only what the visitor said", () => {
    expect(brief).toMatchObject({ goal: "missed_payment", askAprBps: 2724, acceptAprBps: 2724 });
    for (const fact of missedPaymentFacts(card.missedPayment!)) expect(brief.facts).toContain(fact);
    expect(brief.facts).toContain("After the missed payment the APR went from 27.24% to 29.99%.");
    expect(brief.facts).not.toContain("Every payment in the last 12 months was made on time.");
    expect(brief.facts.length).toBeLessThanOrEqual(12);
  });

  it("says why it is calling and never offers a reason that is not in the facts", () => {
    expect(openingLine(brief)).toContain("about a missed payment, to ask for a one-time courtesy adjustment");
    const prompt = systemPrompt(brief);
    expect(prompt).toContain("Never give a reason for a missed payment that is not in FACTS.");
    expect(prompt).toContain("put the APR back from 29.99% to 27.24%");
  });

  it("leaves out the reason sentence for 'something else' and keeps only the note", () => {
    const facts = missedPaymentFacts({ ...card.missedPayment!, reason: "other", note: "" , daysLate: null, paidSince: false, firstInYear: false });
    expect(facts).toEqual([]);
  });
});
