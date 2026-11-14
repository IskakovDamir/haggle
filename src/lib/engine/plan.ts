// Turns the eligible levers into an ordered to-do list with dates.
import { addDays, daysBetween } from "@/lib/format";
import type { CardAccount, IsoDate, Lever, PlanStep } from "@/lib/types";
import { BALANCE_TRANSFER, LIMIT_INCREASE } from "./constants";
import { LEVER_ORDER } from "./levers";

/** Days until a promo rate ends. null when there is no promo or it is already over. */
export function promoEndsInDays(card: CardAccount, today: IsoDate): number | null {
  if (card.promo === null) return null;
  const days = daysBetween(today, card.promo.endsOn);
  return days >= 0 ? days : null;
}

/** 60 days out, or 30 days before a running promo ends when that is sooner. Never in the past. */
function transferDueOn(card: CardAccount, today: IsoDate): IsoDate {
  const promoDays = promoEndsInDays(card, today);
  const dueInDays =
    promoDays === null
      ? BALANCE_TRANSFER.dueInDays
      : Math.min(BALANCE_TRANSFER.dueInDays, Math.max(0, promoDays - BALANCE_TRANSFER.daysBeforePromoEnds));
  return addDays(today, dueInDays);
}

/** Calls for money are due now. A limit increase and a transfer wait, so the calls land first. */
function dueOn(lever: Lever, card: CardAccount, today: IsoDate): IsoDate | null {
  if (lever.kind === "credit_limit_increase") return addDays(today, LIMIT_INCREASE.dueInDays);
  if (lever.kind === "balance_transfer") return transferDueOn(card, today);
  return null;
}

/**
 * Eligible levers only, ordered by kind (see LEVER_ORDER). Within one kind the bigger win comes first;
 * equal values keep the order the cards were given in.
 */
export function buildPlan(cards: CardAccount[], levers: Lever[], today: IsoDate): PlanStep[] {
  const cardById = new Map(cards.map((card) => [card.id, card]));
  const rank = (lever: Lever) => LEVER_ORDER.indexOf(lever.kind);

  const steps: PlanStep[] = [];
  const ordered = levers
    .filter((lever) => lever.eligible)
    // Array.prototype.sort is stable, so ties keep their input order.
    .sort((a, b) => rank(a) - rank(b) || b.potentialAnnualCents - a.potentialAnnualCents);

  for (const lever of ordered) {
    const card = cardById.get(lever.cardId);
    if (!card) continue;
    steps.push({
      id: `${lever.cardId}:${lever.kind}`,
      order: steps.length + 1,
      lever,
      dueOn: dueOn(lever, card, today),
    });
  }
  return steps;
}
