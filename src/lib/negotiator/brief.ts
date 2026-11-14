// The brief: everything the agent may know and say on one call. Built by code from the confirmed card,
// never by a model, so the agent has no source for a fact that is not on the statement.
import { formatApr } from "@/lib/format";
import { missedPaymentFacts } from "@/lib/missed";
import { formatCents, formatShort } from "@/lib/money";
import type { Bps, CardAccount, Lever, LeverKind, NegotiationBrief } from "@/lib/types";

/** The opening ask: this many points off the purchase APR. */
export const ASK_APR_CUT_BPS = 1000;
/** The ask never names a rate below 9.99%. */
export const ASK_APR_FLOOR_BPS = 999;
/** Any cut of 2 points or more counts as a win. */
export const WIN_APR_CUT_BPS = 200;

/** Used wherever a name is needed and the visitor gave none. */
const UNNAMED_HOLDER = "the cardholder";

/**
 * The rate to ask for and the highest rate that still counts as a win.
 * Both are null when the rate is already at or under the floor: the agent then asks what is available
 * instead of naming a number.
 */
export function aprTargets(currentAprBps: Bps): { askAprBps: Bps | null; acceptAprBps: Bps | null } {
  const ask = Math.max(currentAprBps - ASK_APR_CUT_BPS, ASK_APR_FLOOR_BPS);
  if (ask >= currentAprBps) return { askAprBps: null, acceptAprBps: null };
  // Just above the floor the ask itself is a cut of less than 2 points. Getting the ask is still a win.
  return { askAprBps: ask, acceptAprBps: Math.max(currentAprBps - WIN_APR_CUT_BPS, ask) };
}

/** After a missed payment: ask for the rate the card had before the miss. Both null when the rate did not change. */
function oldRateBack(card: CardAccount): { askAprBps: Bps | null; acceptAprBps: Bps | null } {
  const before = card.missedPayment?.aprBeforeBps ?? null;
  if (before === null || before >= card.purchaseAprBps) return { askAprBps: null, acceptAprBps: null };
  return { askAprBps: before, acceptAprBps: before };
}

/** Everything the agent may know and say on one call. Deterministic: no model involved. */
export function buildBrief(input: {
  card: CardAccount;
  holderFirstName: string;
  lever: Lever;
  /** The language the agent speaks. English when left out. */
  language?: "en" | "es";
}): NegotiationBrief {
  const { card } = input;
  const goal = input.lever.kind;
  const holder = oneLine(input.holderFirstName, 40) || UNNAMED_HOLDER;
  const issuerName = oneLine(card.issuerName, 60) || "the bank";
  const targets =
    goal === "apr_reduction"
      ? aprTargets(card.purchaseAprBps)
      : goal === "missed_payment"
        ? oldRateBack(card)
        : { askAprBps: null, acceptAprBps: null };

  return {
    holderFirstName: holder,
    issuer: card.issuer,
    issuerName,
    cardName: oneLine(card.cardName, 80) || "credit card",
    last4: card.last4 !== null && /^\d{4}$/.test(card.last4) ? card.last4 : null,
    goal,
    facts: factsFromCard(card, issuerName, goal),
    balanceCents: card.balanceCents,
    currentAprBps: card.purchaseAprBps,
    annualFeeCents: card.annualFeeCents,
    ...targets,
    fallback: fallbackIntention(holder, goal, card.balanceCents),
    disclosures:
      input.language === "es"
        ? [
            `Le habla Haggle, un asistente de inteligencia artificial que llama en nombre de ${holder === UNNAMED_HOLDER ? "el titular de la tarjeta" : holder}.`,
            "Esta llamada está siendo grabada.",
            `${holder === UNNAMED_HOLDER ? "El titular" : capitalize(holder)} está en la línea para verificar su identidad.`,
          ]
        : [
            `This is Haggle, an AI assistant calling on behalf of ${holder}.`,
            "This call is being recorded.",
            `${capitalize(holder)} is on the line to verify identity.`,
          ],
    ...(input.language === "es" ? { language: "es" as const } : {}),
  };
}

/**
 * The facts the agent may state. Each one is a field of the card; a field that is unknown, or that
 * would not be true, produces no sentence at all.
 */
function factsFromCard(card: CardAccount, issuerName: string, goal: LeverKind): string[] {
  const facts: string[] = [];

  if (card.memberSinceYear !== null) facts.push(`${capitalize(issuerName)} cardholder since ${card.memberSinceYear}.`);
  // The missed-payment call leans on the visitor's own account of the miss, and on nothing else.
  if (goal === "missed_payment" && card.missedPayment) {
    facts.push(...missedPaymentFacts(card.missedPayment));
    if (card.lateFeeCents > 0) facts.push(`A late fee of ${formatShort(card.lateFeeCents)} was charged.`);
    const before = card.missedPayment.aprBeforeBps;
    if (before !== null && before < card.purchaseAprBps) {
      facts.push(`After the missed payment the APR went from ${formatApr(before)} to ${formatApr(card.purchaseAprBps)}.`);
    }
    if (card.interestChargedCents !== null && card.interestChargedCents > 0) {
      facts.push(`Interest of ${formatCents(card.interestChargedCents)} was charged on that statement.`);
    }
  }
  // "Never late" needs a known count of zero, and a late fee on this very statement contradicts it.
  if (card.latePaymentsLast12m === 0 && card.lateFeeCents === 0) {
    facts.push("Every payment in the last 12 months was made on time.");
  }
  if (card.balanceCents > 0) facts.push(`The statement balance is ${formatCents(card.balanceCents)}.`);
  if (card.purchaseAprBps > 0) facts.push(`The purchase APR is ${formatApr(card.purchaseAprBps)}.`);
  if (card.annualFeeCents > 0) facts.push(`The card has an annual fee of ${formatShort(card.annualFeeCents)}.`);

  // Facts that matter for one kind of ask only.
  if (goal === "late_fee_refund" && card.lateFeeCents > 0) {
    facts.push(`A late fee of ${formatShort(card.lateFeeCents)} was charged on the latest statement.`);
  }
  if (goal === "credit_limit_increase" && card.creditLimitCents !== null) {
    facts.push(`The credit limit is ${formatShort(card.creditLimitCents)}.`);
  }
  if (goal === "penalty_apr_review" && card.penaltyAprBps !== null) {
    facts.push(`The penalty APR on this card is ${formatApr(card.penaltyAprBps)}.`);
  }
  // The request schema takes at most 12 facts.
  return facts.slice(0, 12);
}

/**
 * What the holder will do after a "no". Always the holder's own intention, worded so that it claims
 * nothing about any other bank: no offer in hand, no quote, no deadline.
 */
function fallbackIntention(holder: string, goal: LeverKind, balanceCents: number): string {
  const subject = capitalize(holder);
  const moveBalance = `${subject} is prepared to move the balance to a 0% balance transfer card.`;
  const askAgainLater = `${subject} will ask again in a few months.`;

  switch (goal) {
    case "apr_reduction":
    case "balance_transfer":
    case "penalty_apr_review":
      return balanceCents > 0 ? moveBalance : askAgainLater;
    case "annual_fee_waiver":
      return `${subject} is considering a move to a card with no annual fee.`;
    case "late_fee_refund":
    case "missed_payment":
      return `${subject} is considering a different card for everyday spending.`;
    case "credit_limit_increase":
      return askAgainLater;
  }
}

/** Collapse whitespace and cap the length, so text from a statement or a form stays one short line. */
function oneLine(text: string, maxLength: number): string {
  return text.replace(/\s+/g, " ").trim().slice(0, maxLength).trim();
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
