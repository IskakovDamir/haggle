import { describe, expect, it } from "vitest";
import { buildBrief } from "@/lib/negotiator/brief";
import { verifyOutcome } from "@/lib/negotiator/verify";
import { SAMPLE_MISSED, SAMPLE_MISSED_CARD_ID, readMissedForm } from "@/components/missed/missed-model";
import { lever } from "@/lib/negotiator/test-support";
import { bankReplies } from "./bank-replies";

const sample = readMissedForm(SAMPLE_MISSED, { id: SAMPLE_MISSED_CARD_ID, thisYear: 2026 });
if (!sample.ok) throw new Error("the sample form must read");
const card = sample.card;
const brief = buildBrief({ card, holderFirstName: "Maria", lever: lever("missed_payment", card.id) });

describe("bankReplies", () => {
  it("walks Maria's missed payment call with her own numbers", () => {
    const lines = bankReplies(brief, card, "en");
    expect(lines[0]).toMatch(/what happened/i);
    expect(lines.some((line) => line.includes("$40 late fee"))).toBe(true);
    expect(lines.some((line) => line.includes("27.24%"))).toBe(true);
    expect(lines.at(-1)).toMatch(/good day/);
  });

  it("says figures the outcome check can verify", () => {
    const turns = bankReplies(brief, card, "en").map((text, index) => ({ role: "bank" as const, text, at: index }));
    const outcome = verifyOutcome(
      {
        result: "partial",
        aprAfterBps: 2724,
        annualFeeWaivedCents: null,
        lateFeeRefundCents: 4000,
        creditLimitAfterCents: null,
        statementCreditCents: null,
        followUp: null,
        evidence: [{ quote: "I can refund the $40 late fee", turnIndex: 1 }],
      },
      turns,
    );
    expect(outcome.verified).toBe(true);
    expect(outcome.lateFeeRefundCents).toBe(4000);
  });

  it("speaks Spanish on a Spanish call, and stays generic for the cardholder's own request", () => {
    expect(bankReplies(brief, card, "es")[0]).toMatch(/Qué pasó/);
    expect(bankReplies({ ...brief, request: "dispute a charge" }, card, "en")).toHaveLength(4);
  });
});
