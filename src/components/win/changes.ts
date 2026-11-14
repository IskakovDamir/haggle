// What a win changed on the card, as "before" and "after" for the result card.
import { formatApr } from "@/lib/format";
import { formatShort } from "@/lib/money";
import type { CallOutcome, CardAccount } from "@/lib/types";

/** One thing the bank changed. `before` is null when the card has no earlier value to show. */
export type Change = { label: string; before: string | null; after: string };

/** The changes a call won, most valuable kind first: rate, fees, limit, credit. */
export function changesFromOutcome(card: CardAccount, outcome: CallOutcome): Change[] {
  const changes: Change[] = [];

  if (outcome.aprAfterBps !== null && outcome.aprAfterBps < card.purchaseAprBps) {
    changes.push({ label: "APR", before: formatApr(card.purchaseAprBps), after: formatApr(outcome.aprAfterBps) });
  }

  const waived = outcome.annualFeeWaivedCents ?? 0;
  if (waived > 0) {
    changes.push(
      card.annualFeeCents > 0
        ? {
            label: "Annual fee",
            before: formatShort(card.annualFeeCents),
            after: formatShort(Math.max(0, card.annualFeeCents - waived)),
          }
        : { label: "Annual fee waived", before: null, after: formatShort(waived) },
    );
  }

  const refunded = outcome.lateFeeRefundCents ?? 0;
  if (refunded > 0) changes.push({ label: "Late fee refunded", before: null, after: formatShort(refunded) });

  const limit = outcome.creditLimitAfterCents ?? 0;
  if (limit > 0) {
    changes.push({
      label: "Credit limit",
      before: card.creditLimitCents !== null ? formatShort(card.creditLimitCents) : null,
      after: formatShort(limit),
    });
  }

  const credit = outcome.statementCreditCents ?? 0;
  if (credit > 0) changes.push({ label: "Statement credit", before: null, after: formatShort(credit) });

  return changes;
}
