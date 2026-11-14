// The confirm form as data: a card becomes the text in the fields, and the text becomes a card again.
// Pure functions, so the screen only has to draw fields and the rules can be tested without a browser.
import { checkCard } from "@/lib/statement/checks";
import { issuerFromName } from "@/lib/statement/parse";
import type { CardAccount, CaseFile, Extraction, ExtractionWarning, IsoDate } from "@/lib/types";
import {
  dollarsForEditing,
  percentForEditing,
  typedCount,
  typedDate,
  typedDollars,
  typedLast4,
  typedPercent,
  typedText,
  typedYear,
  type Typed,
} from "./typed-values";

/** Every field on the confirm screen, as the text in its input. */
export type CardFormValues = {
  holderFirstName: string;
  issuerName: string;
  cardName: string;
  last4: string;
  balance: string;
  creditLimit: string;
  purchaseApr: string;
  penaltyApr: string;
  promoApr: string;
  promoEndsOn: string;
  minimumPayment: string;
  annualFee: string;
  lateFee: string;
  interestCharged: string;
  statementDate: string;
  dueDate: string;
  memberSinceYear: string;
  latePaymentsLast12m: string;
};

export type CardFormField = keyof CardFormValues;
export type FieldMessages = Partial<Record<CardFormField, string[]>>;

/** Where a warning about a card field is printed. A promo is two inputs; the rest are one. */
const FIELDS_OF: Record<ExtractionWarning["field"], CardFormField[]> = {
  document: [],
  id: [],
  missedPayment: [],
  issuer: ["issuerName"],
  issuerName: ["issuerName"],
  cardName: ["cardName"],
  last4: ["last4"],
  balanceCents: ["balance"],
  creditLimitCents: ["creditLimit"],
  purchaseAprBps: ["purchaseApr"],
  penaltyAprBps: ["penaltyApr"],
  promo: ["promoApr", "promoEndsOn"],
  minimumPaymentCents: ["minimumPayment"],
  annualFeeCents: ["annualFee"],
  lateFeeCents: ["lateFee"],
  interestChargedCents: ["interestCharged"],
  statementDate: ["statementDate"],
  dueDate: ["dueDate"],
  memberSinceYear: ["memberSinceYear"],
  latePaymentsLast12m: ["latePaymentsLast12m"],
};

/**
 * The text each field starts with. A balance or rate of 0 that came with a warning was not read
 * ("we could not find the balance"), so its field starts blank and the visitor has to type it.
 */
export function formValuesFrom(extraction: Extraction, knownFirstName = ""): CardFormValues {
  const { card, warnings } = extraction;
  const flagged = (field: keyof CardAccount) => warnings.some((warning) => warning.field === field);
  const notRead = (amount: number, field: keyof CardAccount) => amount === 0 && flagged(field);

  return {
    holderFirstName: extraction.holderFirstName ?? knownFirstName,
    issuerName: card.issuerName,
    cardName: card.cardName,
    last4: card.last4 ?? "",
    balance: notRead(card.balanceCents, "balanceCents") ? "" : dollarsForEditing(card.balanceCents),
    creditLimit: dollarsForEditing(card.creditLimitCents),
    purchaseApr: notRead(card.purchaseAprBps, "purchaseAprBps") ? "" : percentForEditing(card.purchaseAprBps),
    penaltyApr: percentForEditing(card.penaltyAprBps),
    promoApr: percentForEditing(card.promo?.aprBps ?? null),
    promoEndsOn: card.promo?.endsOn ?? "",
    minimumPayment: dollarsForEditing(card.minimumPaymentCents),
    annualFee: dollarsForEditing(card.annualFeeCents),
    lateFee: dollarsForEditing(card.lateFeeCents),
    interestCharged: dollarsForEditing(card.interestChargedCents),
    statementDate: card.statementDate ?? "",
    dueDate: card.dueDate ?? "",
    memberSinceYear: card.memberSinceYear === null ? "" : String(card.memberSinceYear),
    latePaymentsLast12m: card.latePaymentsLast12m === null ? "" : String(card.latePaymentsLast12m),
  };
}

export type CardFormReading = {
  /** The card as typed. null while any field has an error. */
  card: CardAccount | null;
  holderFirstName: string;
  /** One sentence per field that cannot be used as typed. */
  errors: Partial<Record<CardFormField, string>>;
};

const REQUIRED: Partial<Record<CardFormField, string>> = {
  holderFirstName: "Type the cardholder's first name. The agent uses it on the call.",
  issuerName: "Type the bank's name.",
  balance: "Type the statement balance.",
  purchaseApr: "Type the purchase APR. It is often on the last page, in the interest table.",
};

/**
 * Turns the typed text back into a card. `base` supplies the card id; everything else comes from the form.
 * `today` caps the member-since year.
 */
export function readCardForm(values: CardFormValues, base: Pick<CardAccount, "id">, today: IsoDate): CardFormReading {
  const errors: CardFormReading["errors"] = {};

  /** The typed value, or null when the field is blank. Records the error for a bad or missing value. */
  function read<T>(field: CardFormField, typed: Typed<T>): T | null {
    if (typed.kind === "value") return typed.value;
    if (typed.kind === "invalid") errors[field] = typed.message;
    else if (REQUIRED[field]) errors[field] = REQUIRED[field];
    return null;
  }

  const holderFirstName = read("holderFirstName", typedText(values.holderFirstName, 40)) ?? "";
  const issuerName = read("issuerName", typedText(values.issuerName)) ?? "";
  const promoAprBps = read("promoApr", typedPercent(values.promoApr));
  const promoEndsOn = read("promoEndsOn", typedDate(values.promoEndsOn));
  // A promo needs both halves: a rate without an end date cannot be counted down.
  if (promoAprBps !== null && promoEndsOn === null) errors.promoEndsOn ??= "Add the day the promo rate ends.";
  if (promoEndsOn !== null && promoAprBps === null) errors.promoApr ??= "Add the promo rate.";

  const card: CardAccount = {
    id: base.id,
    issuer: issuerFromName(issuerName),
    issuerName,
    cardName: read("cardName", typedText(values.cardName)) ?? "Credit card",
    last4: read("last4", typedLast4(values.last4)),
    balanceCents: read("balance", typedDollars(values.balance)) ?? 0,
    creditLimitCents: read("creditLimit", typedDollars(values.creditLimit)),
    purchaseAprBps: read("purchaseApr", typedPercent(values.purchaseApr)) ?? 0,
    penaltyAprBps: read("penaltyApr", typedPercent(values.penaltyApr)),
    promo: promoAprBps !== null && promoEndsOn !== null ? { aprBps: promoAprBps, endsOn: promoEndsOn } : null,
    minimumPaymentCents: read("minimumPayment", typedDollars(values.minimumPayment)),
    annualFeeCents: read("annualFee", typedDollars(values.annualFee)) ?? 0,
    lateFeeCents: read("lateFee", typedDollars(values.lateFee)) ?? 0,
    interestChargedCents: read("interestCharged", typedDollars(values.interestCharged)),
    statementDate: read("statementDate", typedDate(values.statementDate)),
    dueDate: read("dueDate", typedDate(values.dueDate)),
    memberSinceYear: read("memberSinceYear", typedYear(values.memberSinceYear, Number(today.slice(0, 4)))),
    latePaymentsLast12m: read("latePaymentsLast12m", typedCount(values.latePaymentsLast12m, 12)),
  };

  const valid = Object.keys(errors).length === 0;
  return { card: valid ? card : null, holderFirstName, errors };
}

/**
 * The warnings to print next to the fields right now.
 * Two kinds arrive with a reading. Notes about the reading itself ("we could not find the balance")
 * stay until the visitor edits that field. Cross-checks between numbers (balance above the limit) are
 * worked out again from what is typed, so fixing either number clears them.
 */
export function warningsToShow(
  extraction: Extraction,
  typedCard: CardAccount | null,
  edited: ReadonlySet<CardFormField>,
): { byField: FieldMessages; general: string[] } {
  const crossChecksAsRead = new Set(checkCard(extraction.card).map((warning) => warning.message));
  const notes = extraction.warnings.filter((warning) => !crossChecksAsRead.has(warning.message));
  const current: ExtractionWarning[] = [
    ...notes.filter((note) => !FIELDS_OF[note.field].some((field) => edited.has(field))),
    ...(typedCard ? checkCard(typedCard) : []),
  ];

  const byField: FieldMessages = {};
  const general: string[] = [];
  for (const warning of current) {
    const field = FIELDS_OF[warning.field][0];
    if (field) byField[field] = [...(byField[field] ?? []), warning.message];
    else general.push(warning.message);
  }
  return { byField, general };
}

/**
 * The card already in the case that this statement belongs to: same bank and same last four digits.
 * Confirming a newer statement for it updates that card instead of adding a second copy.
 */
export function cardAlreadyInCase(caseFile: CaseFile | null, card: CardAccount): CardAccount | null {
  if (!caseFile) return null;
  const sameName = (other: CardAccount) => other.issuerName.trim().toLowerCase() === card.issuerName.trim().toLowerCase();
  return (
    caseFile.cards.find((other) => other.id === card.id) ??
    caseFile.cards.find((other) => card.last4 !== null && other.last4 === card.last4 && sameName(other)) ??
    null
  );
}
