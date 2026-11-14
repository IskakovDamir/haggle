// What the model is asked to copy from a statement, and how that copy becomes a CardAccount.
// The model returns every figure as printed text; code converts it to cents and basis points,
// so a misread shows up as a warning on the field and never as a silently "fixed" number.
import { z } from "zod";
import type { CardAccount, Extraction, ExtractionWarning } from "@/lib/types";
import { checkCard } from "./checks";
import {
  firstNameOf,
  issuerFromName,
  lastFourDigits,
  parseIsoDate,
  parseMoney,
  parsePercent,
  parseWholeNumber,
  stripCardNumbers,
} from "./parse";

// ---- what the model returns -------------------------------------------------------

/** Every field the model copies as text, with the description it is given. */
const PRINTED_FIELDS = {
  issuerName: "The bank or card issuer as printed, for example 'Chase'.",
  cardName: "The card product as printed, for example 'Freedom Unlimited'.",
  cardholderName: "The cardholder's name as printed.",
  accountEnding: "The last four digits of the account number. Never more than four digits.",
  newBalance: "The new balance (statement balance) as printed, for example '$8,400.00'.",
  creditLimit: "The total credit limit (credit line) as printed. Not the available credit.",
  purchaseApr:
    "The standard annual percentage rate for purchases as printed, for example '27.24%'. When a promotional rate is running, this is the standard rate that applies after it ends.",
  penaltyApr: "The penalty APR as printed, when the statement states one.",
  promoApr: "A promotional or introductory APR that is in effect on this statement, as printed.",
  promoEndsOn: "The day the promotional APR ends, written as YYYY-MM-DD.",
  minimumPaymentDue: "The minimum payment due as printed.",
  annualFee:
    "The annual fee (annual membership fee) as printed, whether charged on this statement or stated as the card's fee. '$0' when the statement says in words that the card has no annual fee.",
  lateFeeCharged:
    "A late fee that was charged during this statement period, as printed in the fees or transactions. The amount in a 'Late Payment Warning' is a possible future fee: do not use it.",
  interestCharged: "The total interest charged for this statement period as printed. Not the year-to-date total.",
  statementClosingDate: "The statement closing date, written as YYYY-MM-DD.",
  paymentDueDate: "The payment due date, written as YYYY-MM-DD.",
  memberSinceYear: "The four-digit year in a 'member since' or 'cardmember since' line, for example '2020'.",
  latePaymentsLast12Months:
    "The number of late payments in the last 12 months, in digits, only when the statement states that number.",
} as const;

type PrintedField = keyof typeof PRINTED_FIELDS;
const PRINTED_FIELD_NAMES = Object.keys(PRINTED_FIELDS) as PrintedField[];

const forEachPrintedField = <T>(value: (name: PrintedField) => T) =>
  Object.fromEntries(PRINTED_FIELD_NAMES.map((name) => [name, value(name)])) as Record<PrintedField, T>;

/**
 * The JSON schema sent to the model. Structured output needs every property required and no extra
 * properties, and it cannot express ranges or lengths, which is why `statementReadingSchema` checks again.
 *
 * "Not printed" is an empty string, not null: the API accepts at most 16 nullable properties in one
 * schema and a statement has 18 optional fields. `statementReadingSchema` turns the empty string into null.
 */
export const STATEMENT_JSON_SCHEMA = {
  type: "object",
  properties: {
    isCreditCardStatement: {
      type: "boolean",
      description:
        "True only when the document is a credit card statement. False for a bank account statement, a loan statement, a receipt, a letter or anything else.",
    },
    ...forEachPrintedField((name) => ({
      type: "string",
      description: `${PRINTED_FIELDS[name]} An empty string when it is not printed in the document.`,
    })),
  },
  required: ["isCreditCardStatement", ...PRINTED_FIELD_NAMES],
  additionalProperties: false,
};

/** Longer than anything a statement prints in one of these fields. */
const MAX_PRINTED_LENGTH = 200;

const printedText = z
  .string()
  .max(MAX_PRINTED_LENGTH)
  .transform((text) => text.trim() || null);

/** The model's answer, validated. Each field is the printed text, or null when it was not on the page. */
export const statementReadingSchema = z.strictObject({
  isCreditCardStatement: z.boolean(),
  ...forEachPrintedField(() => printedText),
});

export type StatementReading = z.infer<typeof statementReadingSchema>;

/** A reading with nothing found. Callers fill in the fields they have. */
export const EMPTY_READING: StatementReading = {
  isCreditCardStatement: true,
  ...forEachPrintedField(() => null),
};

// ---- from the model's answer to a card ----------------------------------------------

const EARLIEST_MEMBER_YEAR = 1950;
const MONTHS_IN_HISTORY = 12;

/**
 * Converts a reading into the card the visitor confirms. Anything missing, unreadable or inconsistent
 * becomes a warning on its field. Only the last four digits of the account number are kept, and
 * anything shaped like a full card number is removed from the text fields.
 */
export function toExtraction(
  reading: StatementReading,
  options: { id: string; source: Extraction["source"] },
): Extraction {
  const warnings: ExtractionWarning[] = [];
  const warn = (field: ExtractionWarning["field"], message: string) => {
    warnings.push({ field, message });
  };

  const missing = (printed: string | null): printed is null => printed === null || printed.trim() === "";

  /** Converts printed text, warning when there was text but it could not be read. */
  function convert<T>(
    printed: string | null,
    parse: (text: string) => T | null,
    field: keyof CardAccount,
    label: string,
  ): T | null {
    if (missing(printed)) return null;
    const value = parse(printed);
    if (value === null) warn(field, `We could not read the ${label}. Type it in.`);
    return value;
  }
  const positiveMoney = (printed: string) => {
    const cents = parseMoney(printed);
    return cents !== null && cents >= 0 ? cents : null;
  };

  const issuerName = stripCardNumbers(reading.issuerName ?? "");
  if (!issuerName) warn("issuerName", "We could not find the bank's name. Type it in.");

  let balanceCents = convert(reading.newBalance, parseMoney, "balanceCents", "balance");
  if (missing(reading.newBalance)) warn("balanceCents", "We could not find the balance. Type it in.");
  if (balanceCents !== null && balanceCents < 0) {
    warn("balanceCents", "This statement shows a credit balance, so there is no debt on this card.");
    balanceCents = 0;
  }

  const purchaseAprBps = convert(reading.purchaseApr, parsePercent, "purchaseAprBps", "purchase APR");
  if (missing(reading.purchaseApr)) {
    warn("purchaseAprBps", "We could not find the purchase APR. It is often on the last page, in the interest table. Type it in.");
  }

  const promoAprBps = convert(reading.promoApr, parsePercent, "promo", "promotional APR");
  const promoEndsOn = convert(reading.promoEndsOn, parseIsoDate, "promo", "date the promotional rate ends");
  // A promotion needs both halves. When one half was unreadable, `convert` has already said so.
  if (promoAprBps !== null && missing(reading.promoEndsOn)) {
    warn("promo", "We found a promotional rate but not the day it ends. Add the date if the statement shows it.");
  }
  if (promoEndsOn !== null && missing(reading.promoApr)) {
    warn("promo", "We found a promotion end date but not its rate. Add the rate if the statement shows it.");
  }

  const statementDate = convert(reading.statementClosingDate, parseIsoDate, "statementDate", "statement date");

  let memberSinceYear = convert(reading.memberSinceYear, parseWholeNumber, "memberSinceYear", "member-since year");
  const latestMemberYear = statementDate ? Number(statementDate.slice(0, 4)) : 2100;
  if (memberSinceYear !== null && (memberSinceYear < EARLIEST_MEMBER_YEAR || memberSinceYear > latestMemberYear)) {
    warn("memberSinceYear", "The member-since year does not look right. Type it in.");
    memberSinceYear = null;
  }

  let latePaymentsLast12m = convert(
    reading.latePaymentsLast12Months,
    parseWholeNumber,
    "latePaymentsLast12m",
    "number of late payments",
  );
  if (latePaymentsLast12m !== null && latePaymentsLast12m > MONTHS_IN_HISTORY) {
    warn("latePaymentsLast12m", "The number of late payments does not look right. Type it in.");
    latePaymentsLast12m = null;
  }

  const card: CardAccount = {
    id: options.id,
    issuer: issuerFromName(issuerName),
    issuerName,
    cardName: stripCardNumbers(reading.cardName ?? "") || "Credit card",
    last4: missing(reading.accountEnding) ? null : lastFourDigits(reading.accountEnding),
    balanceCents: balanceCents ?? 0,
    creditLimitCents: convert(reading.creditLimit, positiveMoney, "creditLimitCents", "credit limit"),
    purchaseAprBps: purchaseAprBps ?? 0,
    penaltyAprBps: convert(reading.penaltyApr, parsePercent, "penaltyAprBps", "penalty APR"),
    promo: promoAprBps !== null && promoEndsOn !== null ? { aprBps: promoAprBps, endsOn: promoEndsOn } : null,
    minimumPaymentCents: convert(reading.minimumPaymentDue, positiveMoney, "minimumPaymentCents", "minimum payment"),
    annualFeeCents: convert(reading.annualFee, positiveMoney, "annualFeeCents", "annual fee") ?? 0,
    lateFeeCents: convert(reading.lateFeeCharged, positiveMoney, "lateFeeCents", "late fee") ?? 0,
    interestChargedCents: convert(reading.interestCharged, positiveMoney, "interestChargedCents", "interest charged"),
    statementDate,
    dueDate: convert(reading.paymentDueDate, parseIsoDate, "dueDate", "payment due date"),
    memberSinceYear,
    latePaymentsLast12m,
  };

  // Without a rate there is nothing to compare the printed interest with. Every other check still runs.
  warnings.push(...checkCard(purchaseAprBps === null ? { ...card, interestChargedCents: null } : card));

  return {
    card,
    holderFirstName: missing(reading.cardholderName) ? null : firstNameOf(reading.cardholderName),
    warnings,
    source: options.source,
  };
}
