import { describe, expect, it } from "vitest";
import type { CallOutcome, CallRecord, CardAccount } from "@/lib/types";
import { cardsAfterWins, winSummary } from "./apply-wins";

const card: CardAccount = {
  id: "chase",
  issuer: "chase",
  issuerName: "Chase",
  cardName: "Freedom Unlimited",
  last4: "4417",
  balanceCents: 840000,
  creditLimitCents: 1000000,
  purchaseAprBps: 2724,
  penaltyAprBps: null,
  promo: null,
  minimumPaymentCents: 27468,
  annualFeeCents: 9500,
  lateFeeCents: 4100,
  interestChargedCents: 19068,
  statementDate: "2026-11-06",
  dueDate: "2026-12-01",
  memberSinceYear: 2020,
  latePaymentsLast12m: 0,
};

const outcome = (over: Partial<CallOutcome>): CallOutcome => ({
  result: "won",
  aprAfterBps: null,
  annualFeeWaivedCents: null,
  lateFeeRefundCents: null,
  creditLimitAfterCents: null,
  statementCreditCents: null,
  followUp: null,
  evidence: [],
  verified: true,
  ...over,
});

const call = (id: string, startedAt: string, result: CallOutcome, savedCents = 0): CallRecord => ({
  id,
  cardId: "chase",
  goal: "apr_reduction",
  mode: "text",
  startedAt,
  endedAt: startedAt,
  turns: [],
  outcome: result,
  savings: { annualSavingsCents: savedCents, lines: [], feeCents: 0 },
  paid: null,
});

describe("cardsAfterWins", () => {
  it("applies a confirmed APR cut, fee waiver, refund and higher limit", () => {
    const [after] = cardsAfterWins(
      [card],
      [
        call("a", "2026-11-14T10:00:00Z", outcome({ aprAfterBps: 1999 })),
        call("b", "2026-11-14T11:00:00Z", outcome({ annualFeeWaivedCents: 9500, lateFeeRefundCents: 4100, creditLimitAfterCents: 1250000 })),
      ],
    );
    expect(after).toMatchObject({ purchaseAprBps: 1999, annualFeeCents: 0, lateFeeCents: 0, creditLimitCents: 1250000 });
  });

  it("ignores calls that were declined or not confirmed from the bank's words", () => {
    const [after] = cardsAfterWins(
      [card],
      [
        call("a", "2026-11-14T10:00:00Z", outcome({ aprAfterBps: 1999, verified: false })),
        call("b", "2026-11-14T11:00:00Z", outcome({ result: "declined" })),
      ],
    );
    expect(after).toEqual(card);
  });

  it("never raises the APR and leaves the stored card untouched", () => {
    const [after] = cardsAfterWins([card], [call("a", "2026-11-14T10:00:00Z", outcome({ aprAfterBps: 2999 }))]);
    expect(after.purchaseAprBps).toBe(2724);
    expect(card.purchaseAprBps).toBe(2724);
  });
});

describe("winSummary", () => {
  it("counts confirmed wins and adds up their first-year savings", () => {
    const calls = [
      call("a", "2026-11-14T10:00:00Z", outcome({ aprAfterBps: 1999 }), 60900),
      call("b", "2026-11-14T11:00:00Z", outcome({ result: "declined" }), 0),
    ];
    expect(winSummary(calls)).toEqual({ count: 1, savedCents: 60900 });
  });
});
