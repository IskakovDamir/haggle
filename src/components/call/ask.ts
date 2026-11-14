// What the agent will ask the bank for, as one or two plain sentences for the screen before the call.
import { formatApr } from "@/lib/format";
import { formatShort } from "@/lib/money";
import type { CardAccount, LeverKind, NegotiationBrief } from "@/lib/types";

const GOAL_LABELS: Record<LeverKind, string> = {
  missed_payment: "Missed payment forgiven",
  apr_reduction: "Lower APR",
  annual_fee_waiver: "Annual fee waiver",
  late_fee_refund: "Late fee refund",
  credit_limit_increase: "Higher credit limit",
  penalty_apr_review: "Penalty rate review",
  balance_transfer: "Balance transfer",
};

/** A short name for what a call was about: "Lower APR". */
export function goalLabel(goal: LeverKind): string {
  return GOAL_LABELS[goal];
}

export function askSentence(brief: NegotiationBrief, card: CardAccount): string {
  switch (brief.goal) {
    case "missed_payment": {
      const asks: string[] = [];
      if (card.lateFeeCents > 0) asks.push(`refund the ${formatShort(card.lateFeeCents)} late fee`);
      if (brief.askAprBps !== null) asks.push(`put the APR back from ${formatApr(brief.currentAprBps)} to ${formatApr(brief.askAprBps)}`);
      asks.push("keep the late payment off the credit report");
      const list = asks.length > 1 ? `${asks.slice(0, -1).join(", ")} and ${asks[asks.length - 1]}` : asks[0];
      return `As a one-time courtesy, ${list}.`;
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

/** "Chase Freedom Unlimited ending 4821" */
export function cardLabel(card: Pick<CardAccount, "issuerName" | "cardName" | "last4">): string {
  const name = card.cardName.startsWith(card.issuerName) ? card.cardName : `${card.issuerName} ${card.cardName}`;
  return card.last4 ? `${name} ending ${card.last4}` : name;
}
