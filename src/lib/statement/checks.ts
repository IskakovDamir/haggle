// Cross-checks on one card's numbers. They run on what the model read and on what a visitor typed,
// and they only ever warn: the visitor sees the warning next to the field and decides.
import { formatApr } from "@/lib/format";
import { formatCents } from "@/lib/money";
import type { Bps, CardAccount, Cents, ExtractionWarning } from "@/lib/types";

/** US card APRs sit well under this. Above it, a digit was most likely misread. */
export const MAX_PLAUSIBLE_APR_BPS = 4000;
/** Fees and interest can push a balance a little over the limit, so allow 5% before warning. */
const OVER_LIMIT_MARGIN_BPS = 500;
/**
 * Banks charge interest on the average daily balance over a 28 to 31 day cycle, so the printed figure
 * never equals balance x APR / 12 exactly. Warn only past 25% (or $5 on small balances).
 */
const INTEREST_TOLERANCE_BPS = 2500;
const INTEREST_TOLERANCE_FLOOR_CENTS = 500;

/** The rate interest is charged at today: the promotional rate while one is running. */
function rateInEffect(card: CardAccount): Bps {
  return card.promo ? card.promo.aprBps : card.purchaseAprBps;
}

/** One month of interest at this balance and rate, to compare with the printed figure. */
function expectedMonthlyInterest(balanceCents: Cents, aprBps: Bps): Cents {
  return Math.round((balanceCents * aprBps) / 10_000 / 12);
}

function aprOutOfRange(aprBps: Bps): boolean {
  return aprBps < 0 || aprBps > MAX_PLAUSIBLE_APR_BPS;
}

/** Every problem found in the card's numbers, each tied to the field the visitor should look at. */
export function checkCard(card: CardAccount): ExtractionWarning[] {
  const warnings: ExtractionWarning[] = [];
  const warn = (field: ExtractionWarning["field"], message: string) => warnings.push({ field, message });
  const rangeNote = `Card rates are usually between 0% and ${formatApr(MAX_PLAUSIBLE_APR_BPS)}. Check it against the statement.`;

  if (aprOutOfRange(card.purchaseAprBps)) {
    warn("purchaseAprBps", `A purchase APR of ${formatApr(card.purchaseAprBps)} looks wrong. ${rangeNote}`);
  }
  if (card.penaltyAprBps !== null && aprOutOfRange(card.penaltyAprBps)) {
    warn("penaltyAprBps", `A penalty APR of ${formatApr(card.penaltyAprBps)} looks wrong. ${rangeNote}`);
  }
  if (card.promo && aprOutOfRange(card.promo.aprBps)) {
    warn("promo", `A promotional APR of ${formatApr(card.promo.aprBps)} looks wrong. ${rangeNote}`);
  }

  if (card.creditLimitCents !== null) {
    const ceiling = card.creditLimitCents + Math.round((card.creditLimitCents * OVER_LIMIT_MARGIN_BPS) / 10_000);
    if (card.balanceCents > ceiling) {
      warn(
        "creditLimitCents",
        `The balance (${formatCents(card.balanceCents)}) is above the credit limit (${formatCents(card.creditLimitCents)}). Check both numbers.`,
      );
    }
  }

  if (card.interestChargedCents !== null && card.balanceCents > 0 && !aprOutOfRange(rateInEffect(card))) {
    const expected = expectedMonthlyInterest(card.balanceCents, rateInEffect(card));
    const tolerance = Math.max(INTEREST_TOLERANCE_FLOOR_CENTS, Math.round((expected * INTEREST_TOLERANCE_BPS) / 10_000));
    if (Math.abs(card.interestChargedCents - expected) > tolerance) {
      warn(
        "interestChargedCents",
        `The interest charged (${formatCents(card.interestChargedCents)}) does not match this balance at ${formatApr(rateInEffect(card))}, which comes to about ${formatCents(expected)} a month. Check the APR and the balance.`,
      );
    }
  }

  if (card.minimumPaymentCents !== null && card.balanceCents > 0 && card.minimumPaymentCents > card.balanceCents) {
    warn("minimumPaymentCents", "The minimum payment is larger than the balance. Check both numbers.");
  }

  if (card.statementDate && card.dueDate && card.dueDate < card.statementDate) {
    warn("dueDate", "The payment due date is earlier than the statement date. Check both dates.");
  }
  if (card.promo && card.statementDate && card.promo.endsOn < card.statementDate) {
    warn("promo", "This promotional rate ended before the statement date. Check the end date.");
  }

  return warnings;
}
