// Short pieces of text the plan screen builds from a card, a lever or a call. Pure, so they can be tested.
import { formatDate } from "@/lib/format";
import { formatDollars } from "@/lib/money";
import type { CallOutcome, CallRecord, CardAccount, Lever, PlanStep } from "@/lib/types";

/** "Chase ending in 4417", or "Chase Freedom Unlimited" when the digits are unknown. */
export function cardLabel(card: Pick<CardAccount, "issuerName" | "cardName" | "last4">): string {
  const bank = card.issuerName.trim() || "Card";
  return card.last4 ? `${bank} ending in ${card.last4}` : `${bank} ${card.cardName}`.trim();
}

/** "$529", or null when the lever is not worth money (a higher limit, a penalty rate review). */
export function leverWorth(lever: Pick<Lever, "potentialAnnualCents">): string | null {
  return lever.potentialAnnualCents > 0 ? formatDollars(lever.potentialAnnualCents) : null;
}

/** "Now", or the date the step is due. */
export function stepWhen(step: Pick<PlanStep, "dueOn">): string {
  return step.dueOn === null ? "Now" : formatDate(step.dueOn);
}

/** The most recent finished call about this step, or null when there has not been one. */
export function lastCallFor(calls: CallRecord[], step: PlanStep): CallRecord | null {
  const finished = calls.filter(
    (call) => call.cardId === step.lever.cardId && call.goal === step.lever.kind && call.outcome !== null,
  );
  // ISO timestamps sort as text.
  return finished.reduce<CallRecord | null>((latest, call) => (latest && latest.startedAt >= call.startedAt ? latest : call), null);
}

export const OUTCOME_LABEL: Record<CallOutcome["result"], string> = {
  won: "Won",
  partial: "Partly won",
  declined: "The bank said no",
  unclear: "Result unclear",
};
