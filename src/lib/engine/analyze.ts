import { formatApr, formatDate, formatPoints } from "@/lib/format";
import { formatShort } from "@/lib/money";
import type { Analysis, CardAccount, CardAnalysis, IsoDate, Lever } from "@/lib/types";
import { BALANCE_TRANSFER, EXPECTED_APR_CUT_BPS, MIN_PAYMENT, PUBLISHED_FIGURES } from "./constants";
import { annualInterestCents } from "./interest";
import { leversFor } from "./levers";
import { wholeOrZero } from "./math";
import { simulateMinimumPayments } from "./payoff";
import { percentOf } from "./percent";
import { buildPlan, promoEndsInDays } from "./plan";
import { utilizationPct } from "./utilization";

const sum = (amounts: number[]) => amounts.reduce((total, amount) => total + amount, 0);

function analyzeCard(card: CardAccount, today: IsoDate): CardAnalysis {
  const balance = wholeOrZero(card.balanceCents);
  return {
    cardId: card.id,
    annualInterestCents: annualInterestCents(balance, card.purchaseAprBps),
    minimumOnly: simulateMinimumPayments(balance, card.purchaseAprBps),
    utilizationPct: utilizationPct(balance, card.creditLimitCents),
    promoEndsInDays: promoEndsInDays(card, today),
  };
}

/** Utilization across all cards. null when any limit is unknown, because the real figure cannot be known. */
function totalUtilizationPct(cards: CardAccount[]): number | null {
  const limits = cards.map((card) => card.creditLimitCents);
  if (limits.length === 0 || limits.some((limit) => limit === null || !(limit >= 1))) return null;
  return utilizationPct(sum(cards.map((card) => wholeOrZero(card.balanceCents))), sum(limits as number[]));
}

/**
 * What the calls could win in a year: the eligible levers that are worth money and need a call.
 * A balance transfer is left out on purpose. It would wipe out the same interest an APR cut trims,
 * so adding both would count those dollars twice.
 */
function potentialFromCallsCents(levers: Lever[]): number {
  return sum(levers.filter((lever) => lever.eligible && lever.needsCall).map((lever) => lever.potentialAnnualCents));
}

/** The plain sentences behind the numbers, built from the same constants the math uses. */
function assumptionsFor(cards: CardAccount[], today: IsoDate): string[] {
  const general = [
    "Yearly interest assumes the balance stays where it is today for 12 months.",
    `Minimum payments are estimated as ${percentOf(MIN_PAYMENT.percentOfBalanceBps)} of the balance plus that month's interest, and at least ${formatShort(MIN_PAYMENT.floorCents)}. Your bank's formula may differ a little.`,
    `The value of a lower APR uses the average cut for cardholders who asked, ${formatPoints(EXPECTED_APR_CUT_BPS)} points (${PUBLISHED_FIGURES.source.label}). Your result can be higher or lower.`,
    `A balance transfer is valued as 12 months at 0% minus a ${percentOf(BALANCE_TRANSFER.feeBps)} transfer fee.`,
    "The total counts only what a call can win. A balance transfer is not added on top, because it would save the same interest twice.",
  ];
  // A running promo means the card charges less than its regular rate today. Say which rate the numbers use.
  const promos = cards
    .filter((card) => card.promo !== null && promoEndsInDays(card, today) !== null)
    .map((card) => {
      const promo = card.promo!;
      const name = card.issuerName.trim();
      const subject = name ? `The ${name} card` : "One card";
      return `${subject} has a ${formatApr(promo.aprBps)} promo rate until ${formatDate(promo.endsOn)}. Its numbers use the regular ${formatApr(wholeOrZero(card.purchaseAprBps))} rate that follows.`;
    });
  return [...general, ...promos];
}

/** What the debt costs, which asks are worth making, and in what order. */
export function analyze(cards: CardAccount[], today: IsoDate): Analysis {
  const perCard = cards.map((card) => analyzeCard(card, today));
  const levers = cards.flatMap(leversFor);

  return {
    cards: perCard,
    totals: {
      balanceCents: sum(cards.map((card) => wholeOrZero(card.balanceCents))),
      annualInterestCents: sum(perCard.map((card) => card.annualInterestCents)),
      utilizationPct: totalUtilizationPct(cards),
      potentialAnnualCents: potentialFromCallsCents(levers),
    },
    levers,
    plan: buildPlan(cards, levers, today),
    assumptions: assumptionsFor(cards, today),
  };
}
