// The missed-payment form as plain data: what was typed, what is wrong with it, and the card it becomes.
// No React here, so the rules can be tested on their own.
import { sampleCardId } from "@/components/start/sample-cards";
import { typedCount, typedDollars, typedLast4, typedPercent, typedText, typedYear, type Typed } from "@/components/start/typed-values";
import { MAX_NOTE_CHARS, cleanNote, isMissedReason } from "@/lib/missed";
import { extractionFromManual } from "@/lib/statement/manual";
import type { CardAccount, MissedReason } from "@/lib/types";

export type MissedValues = {
  issuerName: string;
  holderFirstName: string;
  last4: string;
  balance: string;
  apr: string;
  aprRaised: boolean;
  aprBefore: string;
  lateFee: string;
  interestCharged: string;
  daysLate: string;
  memberSinceYear: string;
  paidSince: boolean;
  firstInYear: boolean;
  reason: MissedReason | null;
  note: string;
};

export type MissedField = Exclude<keyof MissedValues, "aprRaised" | "paidSince" | "firstInYear">;

export const BLANK_MISSED: MissedValues = {
  issuerName: "",
  holderFirstName: "",
  last4: "",
  balance: "",
  apr: "",
  aprRaised: false,
  aprBefore: "",
  lateFee: "",
  interestCharged: "",
  daysLate: "",
  memberSinceYear: "",
  paidSince: false,
  firstInYear: false,
  reason: null,
  note: "",
};

/** Made-up numbers for the demo. The card id marks it as sample data everywhere it shows up. */
export const SAMPLE_MISSED: MissedValues = {
  issuerName: "Chase",
  holderFirstName: "Maria",
  last4: "4417",
  balance: "8,400.00",
  apr: "29.99",
  aprRaised: true,
  aprBefore: "27.24",
  lateFee: "40.00",
  interestCharged: "209.93",
  daysLate: "9",
  memberSinceYear: "2016",
  paidSince: true,
  firstInYear: true,
  reason: "account_changed",
  note: "I moved my autopay to a new checking account and the first payment didn't go through.",
};

export const SAMPLE_MISSED_CARD_ID = sampleCardId("maria-chase");

const NOTE_MAX = MAX_NOTE_CHARS;

export type MissedResult =
  | { ok: true; card: CardAccount; holderFirstName: string }
  | { ok: false; errors: Partial<Record<MissedField, string>> };

/** Reads the form. Every problem comes back as a message on its field; nothing throws. */
export function readMissedForm(values: MissedValues, options: { id: string; thisYear: number }): MissedResult {
  const errors: Partial<Record<MissedField, string>> = {};
  const read = <T>(field: MissedField, typed: Typed<T>, needed?: string): T | null => {
    if (typed.kind === "value") return typed.value;
    if (typed.kind === "invalid") errors[field] = typed.message;
    else if (needed) errors[field] = needed;
    return null;
  };

  const issuerName = read("issuerName", typedText(values.issuerName), "Type the bank's name.");
  const holderFirstName = read("holderFirstName", typedText(values.holderFirstName, 40));
  const last4 = read("last4", typedLast4(values.last4));
  const balance = read("balance", typedDollars(values.balance), "Type the card balance.");
  const apr = read("apr", typedPercent(values.apr), "Type the APR the card charges now.");
  const aprBefore = values.aprRaised
    ? read("aprBefore", typedPercent(values.aprBefore), "Type the APR before the bank raised it.")
    : null;
  const lateFee = read("lateFee", typedDollars(values.lateFee));
  const interest = read("interestCharged", typedDollars(values.interestCharged));
  const daysLate = read("daysLate", typedCount(values.daysLate, 180));
  const memberSince = read("memberSinceYear", typedYear(values.memberSinceYear, options.thisYear));
  if (!isMissedReason(values.reason)) errors.reason = "Pick the reason that is true for you.";
  const noteText = values.note.replace(/\s+/g, " ").trim();
  if (noteText.length > NOTE_MAX) errors.note = `Keep it under ${NOTE_MAX} characters.`;
  else if (/\d(?:[ -]?\d){12,}/.test(noteText)) errors.note = "Leave the card number out.";

  if (apr !== null && aprBefore !== null && aprBefore >= apr) {
    errors.aprBefore = "The rate before should be lower than the rate now. If it did not go up, untick the box.";
  }

  if (Object.keys(errors).length > 0 || issuerName === null || balance === null || apr === null || !isMissedReason(values.reason)) {
    return { ok: false, errors };
  }

  const { card: base } = extractionFromManual(
    {
      issuerName,
      balance: String(balance / 100),
      purchaseApr: String(apr / 100),
      last4: last4 ?? undefined,
      lateFee: lateFee === null ? undefined : String(lateFee / 100),
      memberSinceYear: memberSince === null ? undefined : String(memberSince),
    },
    options.id,
  );

  const card: CardAccount = {
    ...base,
    // Exact cents, not a re-parse of the text.
    balanceCents: balance,
    purchaseAprBps: apr,
    lateFeeCents: lateFee ?? 0,
    interestChargedCents: interest,
    latePaymentsLast12m: values.firstInYear ? 1 : base.latePaymentsLast12m,
    missedPayment: {
      reason: values.reason,
      note: cleanNote(noteText),
      daysLate,
      paidSince: values.paidSince,
      firstInYear: values.firstInYear,
      aprBeforeBps: aprBefore,
    },
  };
  return { ok: true, card, holderFirstName: holderFirstName ?? "" };
}
