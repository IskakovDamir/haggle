// Per-issuer notes for the agent's strategy: which team to ask for and which asks usually exist.
// General knowledge only. No phone numbers, no internal policies, no success rates. The system prompt
// tells the agent that none of this may be said to the bank as a fact.
import type { Issuer } from "@/lib/types";

export type Playbook = {
  /** Who to ask for after the first "no". */
  escalateTo: string;
  /** Requests a representative can usually act on. Each call still has exactly one goal. */
  usualAsks: string[];
  /** One more thing worth knowing before the call. */
  note: string;
};

const COMMON_ASKS = ["a lower purchase APR", "a one-time refund of a late fee", "a higher credit limit"];

const PLAYBOOKS: Record<Issuer, Playbook> = {
  chase: {
    escalateTo: "the retention team or a supervisor",
    usualAsks: [...COMMON_ASKS, "a waived or credited annual fee", "a change to a card with no annual fee"],
    note: "If a lower rate is refused, a temporary lower rate is still a concrete improvement worth hearing out.",
  },
  capital_one: {
    escalateTo: "a supervisor or an account specialist",
    usualAsks: [...COMMON_ASKS, "a waived or credited annual fee", "a change to a card with no annual fee"],
    note: "The first representative may be able to decide. Ask the question plainly before asking for anyone else.",
  },
  citi: {
    escalateTo: "the retention team or a supervisor",
    usualAsks: [...COMMON_ASKS, "a waived or credited annual fee", "a temporary lower rate"],
    note: "An offer may be temporary. Ask how long it lasts before reading the terms back.",
  },
  amex: {
    escalateTo: "a retention specialist or a supervisor",
    usualAsks: [...COMMON_ASKS, "a statement credit toward the annual fee"],
    note: "On an annual fee, the answer may be a statement credit rather than a waiver. A credit is a concrete improvement.",
  },
  discover: {
    escalateTo: "an account specialist or a supervisor",
    usualAsks: COMMON_ASKS,
    note: "Many of these cards have no annual fee, so the rate and any late fee are the asks that matter.",
  },
  bank_of_america: {
    escalateTo: "the retention team or a supervisor",
    usualAsks: [...COMMON_ASKS, "a waived or credited annual fee", "a change to a card with no annual fee"],
    note: "If a lower rate is refused, ask whether a temporary lower rate exists before moving on.",
  },
  wells_fargo: {
    escalateTo: "the retention team or a supervisor",
    usualAsks: [...COMMON_ASKS, "a waived or credited annual fee"],
    note: "If a lower rate is refused, ask whether a temporary lower rate exists before moving on.",
  },
  other: {
    escalateTo: "the retention team or a supervisor",
    usualAsks: [...COMMON_ASKS, "a waived or credited annual fee"],
    note: "Smaller issuers vary. Ask what the representative is able to change on the account.",
  },
};

export function playbookFor(issuer: Issuer): Playbook {
  return PLAYBOOKS[issuer];
}
