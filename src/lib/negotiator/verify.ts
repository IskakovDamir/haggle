// The code check on a model-read outcome. A model reads the transcript; this file decides whether
// to believe it. The rule: a number counts as granted only if the bank itself said it.
import type { CallOutcome, Turn } from "@/lib/types";

type Draft = Omit<CallOutcome, "verified">;

/** The numbers a bank can grant. Basis points and cents are both hundredths of the spoken figure. */
const GRANTED_NUMBERS = [
  "aprAfterBps",
  "annualFeeWaivedCents",
  "lateFeeRefundCents",
  "creditLimitAfterCents",
  "statementCreditCents",
] as const satisfies readonly (keyof Draft)[];

/** "1,250", "95", "95.00" and "19.99" as they appear in speech turned to text. */
const NUMBER_IN_TEXT = /\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+(?:\.\d+)?/g;

/**
 * A spoken figure in hundredths: "19.99" is 1999, "95" and "95.00" are 9500, "1,250" is 125000.
 * null when the figure has more precision than a cent or a basis point.
 */
function toHundredths(figure: string): number | null {
  const [whole, fraction = ""] = figure.replace(/,/g, "").split(".");
  if (/[1-9]/.test(fraction.slice(2))) return null;
  return Number(whole) * 100 + Number(fraction.slice(0, 2).padEnd(2, "0"));
}

/** Every figure the bank said during the call, in hundredths. */
function figuresSaidByBank(turns: Turn[]): Set<number> {
  const figures = new Set<number>();
  for (const turn of turns) {
    if (turn.role !== "bank") continue;
    for (const match of turn.text.match(NUMBER_IN_TEXT) ?? []) {
      const value = toHundredths(match);
      if (value !== null) figures.add(value);
    }
  }
  return figures;
}

const looseText = (text: string) => text.toLowerCase().replace(/\s+/g, " ").trim();

/**
 * Keep a quote only when a bank turn really contains it. A quote that sits in a different bank turn
 * than the one cited is kept and pointed at the right turn.
 */
function quotesFoundInBankTurns(evidence: Draft["evidence"], turns: Turn[]): Draft["evidence"] {
  const said = (index: number, quote: string) =>
    turns[index]?.role === "bank" && looseText(turns[index].text).includes(quote);

  return evidence.flatMap((item) => {
    const quote = looseText(item.quote);
    if (quote === "") return [];
    if (said(item.turnIndex, quote)) return [item];
    const actualIndex = turns.findIndex((_, index) => said(index, quote));
    return actualIndex === -1 ? [] : [{ quote: item.quote, turnIndex: actualIndex }];
  });
}

/**
 * Code check on a model-read outcome: every granted number must appear in a bank turn.
 *
 * A number that only the agent said, or that nobody said, is removed, the result becomes "unclear"
 * and `verified` is false. A win with nothing to check (no number and no quote from the bank) is
 * treated the same way. This check can only reject: it never upgrades a result.
 *
 * What it cannot do is understand the sentence around a number. "I can't do 19.99%" contains the
 * figure, so a model that misreads that line is not caught here.
 */
export function verifyOutcome(draft: Omit<CallOutcome, "verified">, turns: Turn[]): CallOutcome {
  const saidByBank = figuresSaidByBank(turns);
  const checked: Draft = { ...draft, evidence: quotesFoundInBankTurns(draft.evidence, turns) };

  // A declined call granted nothing. Numbers on such a draft contradict it, and the "no" wins.
  if (checked.result === "declined") {
    for (const field of GRANTED_NUMBERS) checked[field] = null;
    return { ...checked, verified: true };
  }

  let confirmed = 0;
  let rejected = 0;
  for (const field of GRANTED_NUMBERS) {
    const value = checked[field];
    if (value === null) continue;
    // A waiver or credit of $0 grants nothing. A 0% APR is a real grant and is checked like any other.
    const grantsNothing = field !== "aprAfterBps" && value <= 0;
    if (grantsNothing) {
      checked[field] = null;
    } else if (saidByBank.has(value)) {
      confirmed += 1;
    } else {
      checked[field] = null;
      rejected += 1;
    }
  }

  const claimsWin = checked.result === "won" || checked.result === "partial";
  const winWithoutProof = claimsWin && confirmed === 0 && checked.evidence.length === 0;
  if (rejected > 0 || winWithoutProof) return { ...checked, result: "unclear", verified: false };
  return { ...checked, verified: true };
}
