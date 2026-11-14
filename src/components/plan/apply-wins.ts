// The cards as they stand after the calls already won, so the plan shows today's numbers and not the
// statement's. Pure. The stored cards stay as read: the result page needs the "before" values.
import { isWin } from "@/components/dashboard/progress";
import type { CallRecord, CardAccount, Cents } from "@/lib/types";

/** Each card with every confirmed win applied, oldest call first. */
export function cardsAfterWins(cards: CardAccount[], calls: CallRecord[]): CardAccount[] {
  const wins = calls.filter(isWin).sort((a, b) => a.startedAt.localeCompare(b.startedAt));
  return cards.map((card) =>
    wins
      .filter((call) => call.cardId === card.id)
      .reduce((current, call) => {
        const outcome = call.outcome!;
        const next = { ...current };
        if (outcome.aprAfterBps !== null && outcome.aprAfterBps < next.purchaseAprBps) next.purchaseAprBps = outcome.aprAfterBps;
        if (outcome.annualFeeWaivedCents) next.annualFeeCents = Math.max(0, next.annualFeeCents - outcome.annualFeeWaivedCents);
        if (outcome.lateFeeRefundCents) next.lateFeeCents = Math.max(0, next.lateFeeCents - outcome.lateFeeRefundCents);
        if (outcome.creditLimitAfterCents !== null && outcome.creditLimitAfterCents > (next.creditLimitCents ?? 0)) {
          next.creditLimitCents = outcome.creditLimitAfterCents;
        }
        return next;
      }, card),
  );
}

/** How many calls were won and what they save in the first year. */
export function winSummary(calls: CallRecord[]): { count: number; savedCents: Cents } {
  const wins = calls.filter(isWin);
  return { count: wins.length, savedCents: wins.reduce((sum, call) => sum + (call.savings?.annualSavingsCents ?? 0), 0) };
}
