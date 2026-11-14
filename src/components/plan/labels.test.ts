import { describe, expect, it } from "vitest";
import type { CallOutcome, CallRecord, Lever, PlanStep } from "@/lib/types";
import { cardLabel, lastCallFor, leverWorth, stepWhen } from "./labels";

const lever: Lever = {
  kind: "apr_reduction",
  cardId: "card-1",
  title: "Ask Chase to lower your APR",
  why: "",
  potentialAnnualCents: 52_920,
  successRatePct: 84,
  source: null,
  needsCall: true,
  eligible: true,
  ineligibleReason: null,
};
const step: PlanStep = { id: "card-1:apr_reduction", order: 1, lever, dueOn: null };

const outcome: CallOutcome = {
  result: "declined",
  aprAfterBps: null,
  annualFeeWaivedCents: null,
  lateFeeRefundCents: null,
  creditLimitAfterCents: null,
  statementCreditCents: null,
  followUp: null,
  evidence: [],
  verified: true,
};

const call = (id: string, startedAt: string, change: Partial<CallRecord> = {}): CallRecord => ({
  id,
  cardId: "card-1",
  goal: "apr_reduction",
  mode: "text",
  startedAt,
  endedAt: startedAt,
  turns: [],
  outcome,
  savings: null,
  paid: null,
  ...change,
});

describe("cardLabel", () => {
  it("names the card by bank and last four digits", () => {
    expect(cardLabel({ issuerName: "Chase", cardName: "Freedom Unlimited", last4: "4417" })).toBe("Chase ending in 4417");
  });

  it("falls back to the card name, and to a plain word when the bank is unknown", () => {
    expect(cardLabel({ issuerName: "Chase", cardName: "Freedom Unlimited", last4: null })).toBe("Chase Freedom Unlimited");
    expect(cardLabel({ issuerName: " ", cardName: "Credit card", last4: null })).toBe("Card Credit card");
  });
});

describe("leverWorth and stepWhen", () => {
  it("shows dollars only when the lever is worth money", () => {
    expect(leverWorth(lever)).toBe("$529");
    expect(leverWorth({ potentialAnnualCents: 0 })).toBeNull();
  });

  it("says now, or the date", () => {
    expect(stepWhen(step)).toBe("Now");
    expect(stepWhen({ dueOn: "2026-12-14" })).toBe("Dec 14, 2026");
  });
});

describe("lastCallFor", () => {
  it("finds the most recent finished call about the step", () => {
    const calls = [call("a", "2026-11-14T10:00:00.000Z"), call("b", "2026-11-14T12:00:00.000Z"), call("c", "2026-11-14T11:00:00.000Z")];
    expect(lastCallFor(calls, step)?.id).toBe("b");
  });

  it("ignores unfinished calls and calls about something else", () => {
    const calls = [
      call("open", "2026-11-14T13:00:00.000Z", { outcome: null }),
      call("other-card", "2026-11-14T13:00:00.000Z", { cardId: "card-2" }),
      call("other-goal", "2026-11-14T13:00:00.000Z", { goal: "annual_fee_waiver" }),
    ];
    expect(lastCallFor(calls, step)).toBeNull();
    expect(lastCallFor([], step)).toBeNull();
  });
});
