// What a stored outcome means for the visitor. One rule, used by the result page and the dashboard.
import type { CallOutcome } from "@/lib/types";

export type OutcomeKind =
  /** The bank granted something and code confirmed it from the bank's own words. */
  | "win"
  /** Something was heard, but the numbers were not in the bank's words. It does not count and is never charged. */
  | "unconfirmed"
  | "declined"
  | "unclear";

export function outcomeKind(outcome: CallOutcome): OutcomeKind {
  if (!outcome.verified) return "unconfirmed";
  if (outcome.result === "won" || outcome.result === "partial") return "win";
  return outcome.result === "declined" ? "declined" : "unclear";
}
