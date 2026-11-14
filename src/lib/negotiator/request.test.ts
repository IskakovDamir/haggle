import { describe, expect, it } from "vitest";
import type { LeverKind } from "@/lib/types";
import { buildBrief } from "./brief";
import { NEGOTIATE_LIMITS, OUTCOME_LIMITS, parseCallBody } from "./request";
import { card, lever, mariaCapitalOne, mariaChase, transcript } from "./test-support";

const GOALS: LeverKind[] = [
  "apr_reduction",
  "annual_fee_waiver",
  "late_fee_refund",
  "credit_limit_increase",
  "balance_transfer",
  "penalty_apr_review",
];

describe("parseCallBody", () => {
  it("accepts every brief that buildBrief can produce", () => {
    // The browser builds the brief and sends it back on each request, so the two must agree.
    const wordy = card({
      issuerName: "First National Bank of Somewhere ".repeat(10),
      cardName: "Platinum Rewards Cash Back Signature ".repeat(10),
      balanceCents: 4_999_999,
      purchaseAprBps: 3999,
      annualFeeCents: 69_500,
      lateFeeCents: 4100,
      creditLimitCents: 5_000_000,
      penaltyAprBps: 3999,
      memberSinceYear: 1999,
      latePaymentsLast12m: 0,
    });
    for (const subject of [mariaChase, mariaCapitalOne, card(), wordy]) {
      for (const goal of GOALS) {
        const brief = buildBrief({ card: subject, holderFirstName: "Maria Guadalupe ".repeat(8), lever: lever(goal) });
        expect(parseCallBody({ brief, turns: [] }, NEGOTIATE_LIMITS)).toMatchObject({ ok: true });
      }
    }
  });

  it("returns the brief and the turns it was given", () => {
    const brief = buildBrief({ card: mariaChase, holderFirstName: "Maria", lever: lever("apr_reduction") });
    const turns = transcript(["agent", "Hello."], ["bank", "  How can I help?  "]);
    const parsed = parseCallBody({ brief, turns }, NEGOTIATE_LIMITS);
    expect(parsed).toEqual({ ok: true, brief, turns: [turns[0], { ...turns[1], text: "How can I help?" }] });
  });

  it("names the field that is wrong", () => {
    const brief = buildBrief({ card: mariaChase, holderFirstName: "Maria", lever: lever("apr_reduction") });
    const parsed = parseCallBody({ brief: { ...brief, currentAprBps: 27.24 }, turns: [] }, NEGOTIATE_LIMITS);
    expect(parsed).toMatchObject({ ok: false, code: "bad_request" });
    expect(parsed.ok ? "" : parsed.message).toContain("brief.currentAprBps");
  });

  it("gives a finished call more room than a live one", () => {
    const brief = buildBrief({ card: mariaChase, holderFirstName: "Maria", lever: lever("apr_reduction") });
    const turns = transcript(...Array.from({ length: 45 }, (): ["bank", string] => ["bank", "a".repeat(1500)]));
    expect(parseCallBody({ brief, turns }, NEGOTIATE_LIMITS)).toMatchObject({ ok: false, code: "too_large" });
    expect(parseCallBody({ brief, turns }, OUTCOME_LIMITS)).toMatchObject({ ok: true });
  });
});
