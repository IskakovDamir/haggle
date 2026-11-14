// What a win changed on the card, as "before" and "after" for the result card.
import { formatApr } from "@/lib/format";
import type { Copy, Locale } from "@/lib/i18n/locale";
import { formatShort } from "@/lib/money";
import type { CallOutcome, CardAccount } from "@/lib/types";

/** One thing the bank changed. `before` is null when the card has no earlier value to show. */
export type Change = { label: string; before: string | null; after: string };

type ChangeLabel = "apr" | "annualFee" | "annualFeeWaived" | "lateFeeRefunded" | "creditLimit" | "statementCredit";

const LABELS: Copy<Record<ChangeLabel, string>> = {
  en: {
    apr: "APR",
    annualFee: "Annual fee",
    annualFeeWaived: "Annual fee waived",
    lateFeeRefunded: "Late fee refunded",
    creditLimit: "Credit limit",
    statementCredit: "Statement credit",
  },
  es: {
    apr: "APR",
    annualFee: "Cuota anual",
    annualFeeWaived: "Cuota anual eliminada",
    lateFeeRefunded: "Cargo por pago tardío devuelto",
    creditLimit: "Límite de crédito",
    statementCredit: "Crédito en el estado de cuenta",
  },
};

/** The changes a call won, most valuable kind first: rate, fees, limit, credit. */
export function changesFromOutcome(card: CardAccount, outcome: CallOutcome, locale: Locale = "en"): Change[] {
  const label = LABELS[locale];
  const changes: Change[] = [];

  if (outcome.aprAfterBps !== null && outcome.aprAfterBps < card.purchaseAprBps) {
    changes.push({ label: label.apr, before: formatApr(card.purchaseAprBps), after: formatApr(outcome.aprAfterBps) });
  }

  const waived = outcome.annualFeeWaivedCents ?? 0;
  if (waived > 0) {
    changes.push(
      card.annualFeeCents > 0
        ? {
            label: label.annualFee,
            before: formatShort(card.annualFeeCents),
            after: formatShort(Math.max(0, card.annualFeeCents - waived)),
          }
        : { label: label.annualFeeWaived, before: null, after: formatShort(waived) },
    );
  }

  const refunded = outcome.lateFeeRefundCents ?? 0;
  if (refunded > 0) changes.push({ label: label.lateFeeRefunded, before: null, after: formatShort(refunded) });

  const limit = outcome.creditLimitAfterCents ?? 0;
  if (limit > 0) {
    changes.push({
      label: label.creditLimit,
      before: card.creditLimitCents !== null ? formatShort(card.creditLimitCents) : null,
      after: formatShort(limit),
    });
  }

  const credit = outcome.statementCreditCents ?? 0;
  if (credit > 0) changes.push({ label: label.statementCredit, before: null, after: formatShort(credit) });

  return changes;
}
