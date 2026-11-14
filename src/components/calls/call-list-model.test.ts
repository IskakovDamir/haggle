import { describe, expect, it } from "vitest";
import { analyze } from "@/lib/engine";
import type { CallOutcome, CallRecord, CardAccount, LeverKind } from "@/lib/types";
import { buildCallList } from "./call-list-model";

const base = {
  penaltyAprBps: null,
  promo: null,
  minimumPaymentCents: null,
  lateFeeCents: 0,
  interestChargedCents: null,
  statementDate: null,
  dueDate: null,
  memberSinceYear: 2020,
  latePaymentsLast12m: 0,
} as const;

const chase: CardAccount = { ...base, id: "chase", issuer: "chase", issuerName: "Chase", cardName: "Freedom Unlimited", last4: "4417", balanceCents: 840000, creditLimitCents: 1000000, purchaseAprBps: 2724, annualFeeCents: 0 };
const capone: CardAccount = { ...base, id: "capone", issuer: "capital_one", issuerName: "Capital One", cardName: "Quicksilver", last4: "8062", balanceCents: 310000, creditLimitCents: 400000, purchaseAprBps: 2999, annualFeeCents: 9500 };

const outcome = (result: CallOutcome["result"]): CallOutcome => ({
  result,
  aprAfterBps: result === "won" ? 1999 : null,
  annualFeeWaivedCents: null,
  lateFeeRefundCents: null,
  creditLimitAfterCents: null,
  statementCreditCents: null,
  followUp: null,
  evidence: [],
  verified: true,
});

const call = (cardId: string, goal: LeverKind, result: CallOutcome["result"], savedCents = 0): CallRecord => ({
  id: `${cardId}-${goal}`,
  cardId,
  goal,
  mode: "text",
  startedAt: "2026-11-14T10:00:00Z",
  endedAt: "2026-11-14T10:05:00Z",
  turns: [],
  outcome: outcome(result),
  savings: { annualSavingsCents: savedCents, lines: [], feeCents: 0 },
  paid: null,
});

describe("buildCallList", () => {
  const cards = [chase, capone];
  const plan = analyze(cards, "2026-11-14").plan;

  it("groups every call by bank and leaves out steps that need no call", () => {
    const list = buildCallList(plan, cards, []);
    expect(list.groups.map((group) => group.bank)).toEqual(["Chase", "Capital One"]);
    expect(list.groups.flatMap((group) => group.items).every((item) => item.step.lever.needsCall)).toBe(true);
    expect(list.total).toBe(plan.filter((step) => step.lever.needsCall).length);
    expect(list.done).toBe(0);
    expect(list.next?.id).toBe(plan.find((step) => step.lever.needsCall)?.id);
  });

  it("marks wins and refusals as done and moves on to the next open call", () => {
    const calls = [call("chase", "apr_reduction", "won", 60900), call("capone", "apr_reduction", "declined")];
    const list = buildCallList(plan, cards, calls);
    expect(list.done).toBe(2);
    expect(list.wonCents).toBe(60900);
    const statuses = Object.fromEntries(list.groups.flatMap((group) => group.items).map((item) => [item.step.id, item.status.kind]));
    expect(statuses["chase:apr_reduction"]).toBe("won");
    expect(statuses["capone:apr_reduction"]).toBe("declined");
    expect(list.next?.id).not.toBe("chase:apr_reduction");
    expect(list.next?.id).not.toBe("capone:apr_reduction");
  });

  it("keeps an unclear call on the list", () => {
    const list = buildCallList(plan, cards, [call("chase", "apr_reduction", "unclear")]);
    expect(list.done).toBe(0);
    expect(list.next?.id).toBe("chase:apr_reduction");
  });
});
