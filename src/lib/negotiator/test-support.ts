// Fixtures for the negotiator's tests only. Nothing in the app imports this file: the product builds
// every brief from a statement the visitor confirmed, and every outcome from a real transcript.
import type { CallOutcome, CardAccount, Lever, LeverKind, Turn } from "@/lib/types";
import type { AskModel, JsonRequest } from "./server/model";

/** A card with nothing known about it. Tests override the fields they are about. */
export function card(overrides: Partial<CardAccount> = {}): CardAccount {
  return {
    id: "card",
    issuer: "other",
    issuerName: "Test Bank",
    cardName: "Rewards",
    last4: null,
    balanceCents: 0,
    creditLimitCents: null,
    purchaseAprBps: 0,
    penaltyAprBps: null,
    promo: null,
    minimumPaymentCents: null,
    annualFeeCents: 0,
    lateFeeCents: 0,
    interestChargedCents: null,
    statementDate: null,
    dueDate: null,
    memberSinceYear: null,
    latePaymentsLast12m: null,
    ...overrides,
  };
}

/** Maria's Chase card from SPEC.md: $8,400.00 at 27.24%, a customer since 2020, never late. */
export const mariaChase = card({
  id: "chase",
  issuer: "chase",
  issuerName: "Chase",
  cardName: "Freedom Unlimited",
  last4: "4821",
  balanceCents: 840_000,
  creditLimitCents: 1_000_000,
  purchaseAprBps: 2724,
  memberSinceYear: 2020,
  latePaymentsLast12m: 0,
});

/** Maria's Capital One card: $3,100.00 at 29.99% with a $95 annual fee. Tenure and history unknown. */
export const mariaCapitalOne = card({
  id: "capital-one",
  issuer: "capital_one",
  issuerName: "Capital One",
  cardName: "Capital One Platinum",
  balanceCents: 310_000,
  creditLimitCents: 400_000,
  purchaseAprBps: 2999,
  annualFeeCents: 9500,
});

/** A plan lever of one kind. buildBrief reads only `kind`. */
export function lever(kind: LeverKind, cardId = "card"): Lever {
  return {
    kind,
    cardId,
    title: "",
    why: "",
    potentialAnnualCents: 0,
    successRatePct: null,
    source: null,
    needsCall: true,
    eligible: true,
    ineligibleReason: null,
  };
}

/** A transcript from lines like ["bank", "I can do 19.99%."], one second apart. */
export function transcript(...lines: [Turn["role"], string][]): Turn[] {
  return lines.map(([role, text], index) => ({ role, text, at: index * 1000 }));
}

/** A model-read outcome that claims nothing. Tests override the fields they are about. */
export function draft(overrides: Partial<Omit<CallOutcome, "verified">> = {}): Omit<CallOutcome, "verified"> {
  return {
    result: "declined",
    aprAfterBps: null,
    annualFeeWaivedCents: null,
    lateFeeRefundCents: null,
    creditLimitAfterCents: null,
    statementCreditCents: null,
    followUp: null,
    evidence: [],
    ...overrides,
  };
}

/** A stand-in for Claude: answers every request with `answer` (or rejects with it) and records the requests. */
export function fakeModel(answer: unknown): { ask: AskModel; requests: JsonRequest[] } {
  const requests: JsonRequest[] = [];
  const ask: AskModel = async (request) => {
    requests.push(request);
    if (answer instanceof Error) throw answer;
    return answer;
  };
  return { ask, requests };
}

let nextVisitor = 0;

/** A JSON POST. Each request comes from a new address unless `ip` is given, so rate limits do not leak between tests. */
export function post(path: string, body: unknown, ip?: string): Request {
  nextVisitor += 1;
  return new Request(`http://localhost:3000${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": ip ?? `198.51.100.${nextVisitor}` },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}
