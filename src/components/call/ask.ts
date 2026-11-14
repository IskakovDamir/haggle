// What the agent will ask the bank for, as one or two plain sentences for the screen before the call.
import { formatApr } from "@/lib/format";
import type { Copy, Locale } from "@/lib/i18n/locale";
import { formatShort } from "@/lib/money";
import type { CardAccount, LeverKind, NegotiationBrief } from "@/lib/types";

const GOAL_LABELS: Copy<Record<LeverKind, string>> = {
  en: {
    missed_payment: "Missed payment forgiven",
    apr_reduction: "Lower APR",
    annual_fee_waiver: "Annual fee waiver",
    late_fee_refund: "Late fee refund",
    credit_limit_increase: "Higher credit limit",
    penalty_apr_review: "Penalty rate review",
    balance_transfer: "Balance transfer",
  },
  es: {
    missed_payment: "Perdón del pago atrasado",
    apr_reduction: "APR más bajo",
    annual_fee_waiver: "Exención de la cuota anual",
    late_fee_refund: "Reembolso del cargo por pago tardío",
    credit_limit_increase: "Límite de crédito más alto",
    penalty_apr_review: "Revisión de la tasa de penalización",
    balance_transfer: "Transferencia de saldo",
  },
};

/** A short name for what a call was about: "Lower APR". */
export function goalLabel(goal: LeverKind, locale: Locale = "en"): string {
  return GOAL_LABELS[locale][goal];
}

/** "a, b and c" or "a, b y c". */
function listOf(items: string[], and: string): string {
  return items.length > 1 ? `${items.slice(0, -1).join(", ")} ${and} ${items[items.length - 1]}` : items[0];
}

export function askSentence(brief: NegotiationBrief, card: CardAccount, locale: Locale = "en"): string {
  return locale === "es" ? askSentenceEs(brief, card) : askSentenceEn(brief, card);
}

function askSentenceEn(brief: NegotiationBrief, card: CardAccount): string {
  switch (brief.goal) {
    case "missed_payment": {
      const asks: string[] = [];
      if (card.lateFeeCents > 0) asks.push(`refund the ${formatShort(card.lateFeeCents)} late fee`);
      if (brief.askAprBps !== null) asks.push(`put the APR back from ${formatApr(brief.currentAprBps)} to ${formatApr(brief.askAprBps)}`);
      asks.push("keep the late payment off the credit report");
      return `As a one-time courtesy, ${listOf(asks, "and")}.`;
    }
    case "apr_reduction": {
      if (brief.askAprBps === null) return `Lower the ${formatApr(brief.currentAprBps)} APR.`;
      const ask = `Lower the APR from ${formatApr(brief.currentAprBps)} to ${formatApr(brief.askAprBps)}.`;
      return brief.acceptAprBps === null ? ask : `${ask} Anything at ${formatApr(brief.acceptAprBps)} or lower counts as a win.`;
    }
    case "annual_fee_waiver":
      return `Waive the ${formatShort(brief.annualFeeCents)} annual fee.`;
    case "late_fee_refund":
      return `Refund the ${formatShort(card.lateFeeCents)} late fee.`;
    case "credit_limit_increase":
      return card.creditLimitCents === null
        ? "Raise the credit limit."
        : `Raise the credit limit above ${formatShort(card.creditLimitCents)}.`;
    case "penalty_apr_review":
      return `Review the ${formatApr(brief.currentAprBps)} penalty rate and bring the APR back down.`;
    case "balance_transfer":
      return "Nothing. A balance transfer does not need a call.";
  }
}

function askSentenceEs(brief: NegotiationBrief, card: CardAccount): string {
  switch (brief.goal) {
    case "missed_payment": {
      const asks: string[] = [];
      if (card.lateFeeCents > 0) asks.push(`devolver el cargo por pago tardío de ${formatShort(card.lateFeeCents)}`);
      if (brief.askAprBps !== null) asks.push(`regresar el APR de ${formatApr(brief.currentAprBps)} a ${formatApr(brief.askAprBps)}`);
      asks.push("dejar el pago atrasado fuera del reporte de crédito");
      return `Como cortesía por única vez: ${listOf(asks, "y")}.`;
    }
    case "apr_reduction": {
      if (brief.askAprBps === null) return `Bajar el APR de ${formatApr(brief.currentAprBps)}.`;
      const ask = `Bajar el APR de ${formatApr(brief.currentAprBps)} a ${formatApr(brief.askAprBps)}.`;
      return brief.acceptAprBps === null ? ask : `${ask} Cualquier tasa de ${formatApr(brief.acceptAprBps)} o menos cuenta como victoria.`;
    }
    case "annual_fee_waiver":
      return `Eliminar la cuota anual de ${formatShort(brief.annualFeeCents)}.`;
    case "late_fee_refund":
      return `Devolver el cargo por pago tardío de ${formatShort(card.lateFeeCents)}.`;
    case "credit_limit_increase":
      return card.creditLimitCents === null
        ? "Subir el límite de crédito."
        : `Subir el límite de crédito por encima de ${formatShort(card.creditLimitCents)}.`;
    case "penalty_apr_review":
      return `Revisar la tasa de penalización de ${formatApr(brief.currentAprBps)} y volver a bajar el APR.`;
    case "balance_transfer":
      return "Nada. Una transferencia de saldo no necesita una llamada.";
  }
}

/** The card name the missed-payment form gives a card it has no name for. */
const GENERIC_CARD_NAME = "Credit card";

/** "Chase Freedom Unlimited ending 4821", or "Chase Freedom Unlimited terminada en 4821". */
export function cardLabel(card: Pick<CardAccount, "issuerName" | "cardName" | "last4">, locale: Locale = "en"): string {
  if (locale === "es") {
    // "Chase Credit card" reads oddly in Spanish; the bank's name says it.
    const name =
      card.cardName === GENERIC_CARD_NAME
        ? card.issuerName
        : card.cardName.startsWith(card.issuerName)
          ? card.cardName
          : `${card.issuerName} ${card.cardName}`;
    return card.last4 ? `${name} terminada en ${card.last4}` : name;
  }
  // A card with no real name is "Chase card", not "Chase Credit card".
  const name =
    card.cardName === GENERIC_CARD_NAME
      ? `${card.issuerName} card`
      : card.cardName.startsWith(card.issuerName)
        ? card.cardName
        : `${card.issuerName} ${card.cardName}`;
  return card.last4 ? `${name} ending ${card.last4}` : name;
}
