// The missed-payment reasons: what the visitor picks, and the one sentence the agent may say for it.
// The agent never picks or improves a reason. It says the one the visitor chose, in these words, or nothing.
import type { MissedPayment, MissedReason } from "@/lib/types";

export const MISSED_REASONS: readonly { id: MissedReason; label: string; fact: string | null }[] = [
  { id: "autopay_failed", label: "Autopay didn't go through", fact: "The payment was missed because autopay did not go through." },
  {
    id: "account_changed",
    label: "I changed bank accounts",
    fact: "The payment was missed because the cardholder changed bank accounts and the payment did not go out.",
  },
  { id: "travel", label: "I was traveling", fact: "The payment was missed while the cardholder was traveling." },
  { id: "medical", label: "A medical issue", fact: "The payment was missed during a medical issue." },
  { id: "income_drop", label: "My income dropped", fact: "The payment was missed after a drop in the cardholder's income." },
  { id: "forgot", label: "I just forgot", fact: "The cardholder forgot the due date. It was an honest mistake." },
  { id: "other", label: "Something else", fact: null },
];

const BY_ID = new Map(MISSED_REASONS.map((reason) => [reason.id, reason]));

export function isMissedReason(value: unknown): value is MissedReason {
  return typeof value === "string" && BY_ID.has(value as MissedReason);
}

export function reasonLabel(reason: MissedReason): string {
  return BY_ID.get(reason)?.label ?? "Something else";
}

/** The longest note the agent may quote. Longer notes are cut at a word. */
export const MAX_NOTE_CHARS = 150;

/** Collapse a typed note to one short line. */
export function cleanNote(note: string): string {
  const flat = note.replace(/\s+/g, " ").trim();
  if (flat.length <= MAX_NOTE_CHARS) return flat;
  const cut = flat.slice(0, MAX_NOTE_CHARS);
  const space = cut.lastIndexOf(" ");
  return (space > 80 ? cut.slice(0, space) : cut).trim();
}

/** Late payments are reported to the credit bureaus once they are 30 days past due. */
export const BUREAU_REPORTING_DAYS = 30;

/**
 * The sentences the agent may state about the missed payment, built only from what the visitor told us.
 * A field the visitor left out produces no sentence.
 */
export function missedPaymentFacts(missed: MissedPayment): string[] {
  const facts: string[] = [];
  const reason = BY_ID.get(missed.reason)?.fact;
  if (reason) facts.push(reason);
  const note = cleanNote(missed.note);
  if (note) facts.push(`In the cardholder's own words: "${note.replace(/"/g, "'")}"`);
  if (missed.daysLate !== null && missed.daysLate > 0) {
    facts.push(`The payment was ${missed.daysLate} ${missed.daysLate === 1 ? "day" : "days"} late.`);
  }
  if (missed.paidSince) facts.push("The missed payment has been paid since.");
  if (missed.firstInYear) facts.push("It is the cardholder's first late payment in the last 12 months.");
  return facts;
}
