// The asks worth making on one card. Each lever is decided by code from the card's own numbers, and its
// sentences are built from the same numbers, so the copy can never disagree with the math.
import { formatApr, formatPoints } from "@/lib/format";
import { formatDollars, formatShort } from "@/lib/money";
import type { CardAccount, Cents, Lever, LeverKind } from "@/lib/types";
import { BALANCE_TRANSFER, EXPECTED_APR_CUT_BPS, LIMIT_INCREASE, PUBLISHED_FIGURES } from "./constants";
import { annualInterestCents, shareOfCents } from "./interest";
import { wholeOrZero } from "./math";
import { formatUtilization, percentOf } from "./percent";
import { utilizationPct } from "./utilization";

/** The order levers are listed in and worked through: calls for money first, the transfer last. */
export const LEVER_ORDER: readonly LeverKind[] = [
  "missed_payment",
  "apr_reduction",
  "annual_fee_waiver",
  "late_fee_refund",
  "penalty_apr_review",
  "credit_limit_increase",
  "balance_transfer",
];

/** Either the case for asking, with its first-year value, or the reason not to. */
type Verdict = { why: string; valueCents: Cents } | { reason: string };

type LeverRule = {
  needsCall: boolean;
  title: (card: CardAccount) => string;
  judge: (card: CardAccount) => Verdict;
};

const bankName = (card: CardAccount) => card.issuerName.trim() || "your bank";
const balanceOf = (card: CardAccount) => wholeOrZero(card.balanceCents);
const aprOf = (card: CardAccount) => wholeOrZero(card.purchaseAprBps);
/** "$95 " when there is a fee to name, nothing when there is none. */
const feeLabel = (feeCents: Cents) => (wholeOrZero(feeCents) > 0 ? `${formatShort(wholeOrZero(feeCents))} ` : "");

/** The asks a missed-payment call already covers, so they are not counted or called about twice. */
const COVERED_BY_MISSED_CALL = "This is part of the missed-payment call for this card.";

/** The rate the bank moved the card to after the miss, and the rate before. null when it did not change. */
function rateRaise(card: CardAccount): { before: number; now: number } | null {
  const before = card.missedPayment?.aprBeforeBps;
  const now = aprOf(card);
  if (before === null || before === undefined || !(before >= 0) || before >= now) return null;
  return { before: Math.round(before), now };
}

const RULES: Record<LeverKind, LeverRule> = {
  missed_payment: {
    needsCall: true,
    title: (card) => `Ask ${bankName(card)} to forgive the missed payment`,
    judge: (card) => {
      if (!card.missedPayment) return { reason: "You have not told us about a missed payment on this card." };
      const fee = wholeOrZero(card.lateFeeCents);
      const raise = rateRaise(card);
      const raiseCost = raise ? annualInterestCents(balanceOf(card), raise.now - raise.before) : 0;
      const parts: string[] = [];
      if (fee > 0) parts.push(`a ${formatShort(fee)} late fee`);
      if (raise) {
        parts.push(
          `a rate raised from ${formatApr(raise.before)} to ${formatApr(raise.now)}, about ${formatDollars(raiseCost)} a year on this balance`,
        );
      }
      const cost = parts.length > 0 ? `The missed payment cost you ${parts.join(" and ")}.` : "The missed payment is on your record.";
      const ask =
        "A goodwill call asks the bank to take it back as a one-time courtesy and to keep the late payment off your credit report.";
      return { why: `${cost} ${ask}`, valueCents: fee + raiseCost };
    },
  },

  apr_reduction: {
    needsCall: true,
    title: (card) => `Ask ${bankName(card)} to lower your APR`,
    judge: (card) => {
      const balance = balanceOf(card);
      const apr = aprOf(card);
      if (balance === 0) return { reason: "There is no balance on this card, so a lower rate would not save anything." };
      if (apr === 0) return { reason: "This card's APR is already 0%." };
      // Asking for less than the raised rate would count the same interest twice. Get the old rate back first.
      if (rateRaise(card)) return { reason: `${COVERED_BY_MISSED_CALL} Ask for a lower rate after it, once the old rate is back.` };

      // A cut can never be worth more than the interest itself.
      const cutBps = Math.min(EXPECTED_APR_CUT_BPS, apr);
      const valueCents = annualInterestCents(balance, cutBps);
      const cost = `At ${formatApr(apr)} this balance costs about ${formatDollars(annualInterestCents(balance, apr))} a year in interest.`;
      const average = `Cardholders who ask get an average cut of ${formatPoints(EXPECTED_APR_CUT_BPS)} points`;
      const worth =
        cutBps === EXPECTED_APR_CUT_BPS
          ? `${average}, worth about ${formatDollars(valueCents)} a year here.`
          : `${average}. Here a lower rate can save at most about ${formatDollars(valueCents)} a year.`;
      return { why: `${cost} ${worth}`, valueCents };
    },
  },

  annual_fee_waiver: {
    needsCall: true,
    title: (card) => `Ask ${bankName(card)} to waive the ${feeLabel(card.annualFeeCents)}annual fee`,
    judge: (card) => {
      const fee = wholeOrZero(card.annualFeeCents);
      if (fee === 0) return { reason: "This card has no annual fee." };
      return {
        why: `This card charges a ${formatShort(fee)} annual fee. A full waiver is worth ${formatShort(fee)} a year.`,
        valueCents: fee,
      };
    },
  },

  late_fee_refund: {
    needsCall: true,
    title: (card) => `Ask ${bankName(card)} to refund the ${feeLabel(card.lateFeeCents)}late fee`,
    judge: (card) => {
      if (card.missedPayment) return { reason: COVERED_BY_MISSED_CALL };
      const fee = wholeOrZero(card.lateFeeCents);
      if (fee === 0) return { reason: "There is no late fee on this statement." };
      return {
        why: `This statement shows a ${formatShort(fee)} late fee. A refund puts that ${formatShort(fee)} back.`,
        valueCents: fee,
      };
    },
  },

  penalty_apr_review: {
    needsCall: true,
    title: (card) => `Ask ${bankName(card)} to review your penalty APR`,
    judge: (card) => {
      if (card.missedPayment) return { reason: COVERED_BY_MISSED_CALL };
      const apr = aprOf(card);
      const penalty = card.penaltyAprBps === null ? 0 : wholeOrZero(card.penaltyAprBps);
      if (penalty === 0) return { reason: "The statement does not show a penalty APR." };
      if (apr < penalty) {
        return { reason: `Your ${formatApr(apr)} APR is below this card's penalty rate of ${formatApr(penalty)}.` };
      }
      return {
        why: `Your ${formatApr(apr)} APR is at or above this card's penalty rate of ${formatApr(penalty)}, so you may be paying the penalty rate. Ask the bank to review it and move you back to the regular rate.`,
        valueCents: 0,
      };
    },
  },

  credit_limit_increase: {
    needsCall: true,
    title: (card) => `Ask ${bankName(card)} for a higher credit limit`,
    judge: (card) => {
      const balance = balanceOf(card);
      const now = utilizationPct(balance, card.creditLimitCents);
      if (card.creditLimitCents === null || now === null) {
        return { reason: "We do not know this card's credit limit, so we cannot tell if a higher one would help." };
      }
      // Judged on the rounded figure, so the sentence and the decision always agree.
      if (now < LIMIT_INCREASE.minUtilizationPct) {
        return {
          reason: `You are using ${formatUtilization(now)} of this card's limit, which is already under ${LIMIT_INCREASE.minUtilizationPct}%.`,
        };
      }
      const limit = wholeOrZero(card.creditLimitCents);
      const raisedLimit = limit + shareOfCents(limit, LIMIT_INCREASE.raiseBps);
      const after = utilizationPct(balance, raisedLimit) ?? now;
      return {
        why: `You are using ${formatUtilization(now)} of this card's ${formatShort(limit)} limit. With a ${percentOf(LIMIT_INCREASE.raiseBps)} higher limit (${formatShort(raisedLimit)}) the same balance would use ${formatUtilization(after)}, which usually helps a credit score.`,
        valueCents: 0,
      };
    },
  },

  balance_transfer: {
    needsCall: false,
    title: (card) =>
      card.issuerName.trim()
        ? `Move your ${card.issuerName.trim()} balance to a 0% transfer card`
        : "Move this balance to a 0% transfer card",
    judge: (card) => {
      const balance = balanceOf(card);
      const apr = aprOf(card);
      if (balance < BALANCE_TRANSFER.minBalanceCents) {
        return {
          reason: `The balance is under ${formatShort(BALANCE_TRANSFER.minBalanceCents)}, so a transfer would save too little to be worth it.`,
        };
      }
      if (apr < BALANCE_TRANSFER.minAprBps) {
        return { reason: `At ${formatApr(apr)} a transfer would save too little to be worth it.` };
      }
      const interest = annualInterestCents(balance, apr);
      const fee = shareOfCents(balance, BALANCE_TRANSFER.feeBps);
      const valueCents = interest - fee;
      return {
        why: `A 0% transfer card would stop about ${formatDollars(interest)} a year in interest on this balance. After a ${percentOf(BALANCE_TRANSFER.feeBps)} transfer fee (${formatDollars(fee)}) that leaves about ${formatDollars(valueCents)} in the first year. It usually needs good credit.`,
        valueCents,
      };
    },
  },
};

/** A published success rate and its source, for the asks the survey covers. */
function publishedFor(kind: LeverKind): Pick<Lever, "successRatePct" | "source"> {
  const rates: Partial<Record<LeverKind, number>> = PUBLISHED_FIGURES.successRatePct;
  const successRatePct = rates[kind];
  if (successRatePct === undefined) return { successRatePct: null, source: null };
  return { successRatePct, source: { ...PUBLISHED_FIGURES.source } };
}

function leverFor(card: CardAccount, kind: LeverKind): Lever {
  const rule = RULES[kind];
  const verdict = rule.judge(card);
  const base = { kind, cardId: card.id, title: rule.title(card), needsCall: rule.needsCall };

  if ("reason" in verdict) {
    return {
      ...base,
      why: verdict.reason,
      potentialAnnualCents: 0,
      successRatePct: null,
      source: null,
      eligible: false,
      ineligibleReason: verdict.reason,
    };
  }
  return {
    ...base,
    why: verdict.why,
    potentialAnnualCents: verdict.valueCents,
    ...publishedFor(kind),
    eligible: true,
    ineligibleReason: null,
  };
}

/** All six levers for one card, in plan order. The ones that do not apply say why. */
export function leversFor(card: CardAccount): Lever[] {
  return LEVER_ORDER.map((kind) => leverFor(card, kind));
}
