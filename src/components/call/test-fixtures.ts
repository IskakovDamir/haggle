// Builders for the tests of the call, result and dashboard helpers. Nothing in the app imports this file:
// the product computes every number from a statement the visitor confirms and a call the visitor makes.
import type { CallOutcome, CallRecord, CardAccount, CaseFile, Lever, PlanStep } from "@/lib/types";

/** The Chase card from SPEC.md's persona: $8,400.00 at 27.24%. Tests override the fields they are about. */
export function testCard(overrides: Partial<CardAccount> = {}): CardAccount {
  return {
    id: "chase",
    issuer: "chase",
    issuerName: "Chase",
    cardName: "Freedom Unlimited",
    last4: "4821",
    balanceCents: 840_000,
    creditLimitCents: 1_000_000,
    purchaseAprBps: 2724,
    penaltyAprBps: null,
    promo: null,
    minimumPaymentCents: null,
    annualFeeCents: 0,
    lateFeeCents: 0,
    interestChargedCents: null,
    statementDate: null,
    dueDate: null,
    memberSinceYear: 2020,
    latePaymentsLast12m: 0,
    ...overrides,
  };
}

/** A confirmed outcome that grants nothing yet. Tests add what the bank granted. */
export function testOutcome(overrides: Partial<CallOutcome> = {}): CallOutcome {
  return {
    result: "won",
    aprAfterBps: null,
    annualFeeWaivedCents: null,
    lateFeeRefundCents: null,
    creditLimitAfterCents: null,
    statementCreditCents: null,
    followUp: null,
    evidence: [],
    verified: true,
    ...overrides,
  };
}

/** A finished call about the Chase card's APR, made at noon UTC on Nov 14, 2026. */
export function testCall(overrides: Partial<CallRecord> = {}): CallRecord {
  return {
    id: "call-1",
    cardId: "chase",
    goal: "apr_reduction",
    mode: "text",
    startedAt: "2026-11-14T12:00:00.000Z",
    endedAt: "2026-11-14T12:06:42.000Z",
    turns: [],
    outcome: null,
    savings: null,
    paid: null,
    ...overrides,
  };
}

export function testStep(overrides: Partial<Lever> = {}, dueOn: string | null = null): PlanStep {
  const lever: Lever = {
    kind: "apr_reduction",
    cardId: "chase",
    title: "Ask Chase to lower your APR",
    why: "At 27.24% this balance costs about $2,288 a year in interest.",
    potentialAnnualCents: 52_920,
    successRatePct: null,
    source: null,
    needsCall: true,
    eligible: true,
    ineligibleReason: null,
    ...overrides,
  };
  return { id: `${lever.cardId}:${lever.kind}`, order: 1, lever, dueOn };
}

export function testCase(overrides: Partial<CaseFile> = {}): CaseFile {
  return {
    version: 1,
    id: "case-1",
    createdAt: "2026-11-14T11:00:00.000Z",
    holderFirstName: "Maria",
    cards: [testCard()],
    calls: [],
    ...overrides,
  };
}
