// The path with no upload and no key: the visitor types the numbers from their statement.
// Typed text goes through the same conversion and cross-checks as a statement the model read,
// so "27.24%" and "$8,400" mean the same thing on both paths. Safe to import in the browser.
import type { Extraction } from "@/lib/types";
import { EMPTY_READING, toExtraction } from "./schema";

/** What the form collects, as typed. Leave out (or leave blank) anything the visitor does not know. */
export type ManualEntry = {
  issuerName: string;
  /** "$8,400" or "8400.00" */
  balance: string;
  /** "27.24" or "27.24%" */
  purchaseApr: string;
  holderFirstName?: string;
  cardName?: string;
  last4?: string;
  creditLimit?: string;
  minimumPayment?: string;
  annualFee?: string;
  lateFee?: string;
  memberSinceYear?: string;
  latePaymentsLast12m?: string;
};

const typed = (value: string | undefined) => (value && value.trim() !== "" ? value.trim() : null);

/** Builds the card from typed numbers. Problems come back as warnings on the fields, never as a throw. */
export function extractionFromManual(entry: ManualEntry, id: string = crypto.randomUUID()): Extraction {
  return toExtraction(
    {
      ...EMPTY_READING,
      issuerName: typed(entry.issuerName),
      cardName: typed(entry.cardName),
      cardholderName: typed(entry.holderFirstName),
      accountEnding: typed(entry.last4),
      newBalance: typed(entry.balance),
      purchaseApr: typed(entry.purchaseApr),
      creditLimit: typed(entry.creditLimit),
      minimumPaymentDue: typed(entry.minimumPayment),
      annualFee: typed(entry.annualFee),
      lateFeeCharged: typed(entry.lateFee),
      memberSinceYear: typed(entry.memberSinceYear),
      latePaymentsLast12Months: typed(entry.latePaymentsLast12m),
    },
    { id, source: "manual" },
  );
}
