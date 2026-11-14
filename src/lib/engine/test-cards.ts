// Cards for the engine's tests only. Nothing in the app imports this file: the product computes every
// number from a statement the visitor confirms.
import type { CallOutcome, CardAccount } from "@/lib/types";

/** A card with nothing on it. Tests override the fields they are about. */
export function card(overrides: Partial<CardAccount> = {}): CardAccount {
  return {
    id: "card",
    issuer: "other",
    issuerName: "Test Bank",
    cardName: "Test Card",
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

/** Maria's Chase Freedom Unlimited (SPEC.md, "Persona"): $8,400.00 at 27.24%, $10,000 limit, no annual fee. */
export const mariaChase = card({
  id: "chase",
  issuer: "chase",
  issuerName: "Chase",
  cardName: "Freedom Unlimited",
  balanceCents: 840_000,
  creditLimitCents: 1_000_000,
  purchaseAprBps: 2724,
  memberSinceYear: 2020,
  latePaymentsLast12m: 0,
});

/** Maria's Capital One card: $3,100.00 at 29.99%, $4,000 limit, $95 annual fee. */
export const mariaCapitalOne = card({
  id: "capital-one",
  issuer: "capital_one",
  issuerName: "Capital One",
  cardName: "Capital One",
  balanceCents: 310_000,
  creditLimitCents: 400_000,
  purchaseAprBps: 2999,
  annualFeeCents: 9500,
});

/** A call where the bank granted nothing. Tests override the fields they are about. */
export function outcome(overrides: Partial<CallOutcome> = {}): CallOutcome {
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
