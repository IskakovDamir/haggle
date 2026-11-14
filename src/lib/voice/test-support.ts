// Fixtures for the voice tests only. Nothing in the app imports this file: the product builds every
// brief from a statement the visitor confirmed.
import type { NegotiationBrief } from "@/lib/types";

/** The brief for Maria's Chase card from SPEC.md: $8,400.00 at 27.24%, asking for a lower APR. */
export function mariaBrief(overrides: Partial<NegotiationBrief> = {}): NegotiationBrief {
  return {
    holderFirstName: "Maria",
    issuer: "chase",
    issuerName: "Chase",
    cardName: "Freedom Unlimited",
    last4: "4821",
    goal: "apr_reduction",
    facts: ["Chase cardholder since 2020.", "The statement balance is $8,400.00.", "The purchase APR is 27.24%."],
    balanceCents: 840_000,
    currentAprBps: 2724,
    annualFeeCents: 0,
    askAprBps: 1724,
    acceptAprBps: 2524,
    fallback: "Maria is prepared to move the balance to a 0% balance transfer card.",
    disclosures: [
      "This is Haggle, an AI assistant calling on behalf of Maria.",
      "This call is being recorded.",
      "Maria can join the call to verify identity.",
    ],
    ...overrides,
  };
}

let nextVisitor = 0;

/** A JSON POST to the voice route. Each request comes from a new address unless `ip` is given, so rate limits do not leak between tests. */
export function sessionRequest(body: unknown, ip?: string): Request {
  nextVisitor += 1;
  return new Request("http://localhost:3000/api/voice/session", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": ip ?? `203.0.113.${nextVisitor}` },
    body: JSON.stringify(body),
  });
}
