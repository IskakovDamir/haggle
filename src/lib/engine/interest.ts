import type { Bps, Cents } from "@/lib/types";
import { mulDivHalfUp } from "./math";

const BPS_PER_WHOLE = 10_000;
const MONTHS_PER_YEAR = 12;

/** One month of interest on a balance, rounded half up to the cent. */
export function monthlyInterestCents(balanceCents: Cents, aprBps: Bps): Cents {
  return mulDivHalfUp(balanceCents, aprBps, BPS_PER_WHOLE * MONTHS_PER_YEAR);
}

/** Interest over 12 months if the balance stays where it is: balance x APR. */
export function annualInterestCents(balanceCents: Cents, aprBps: Bps): Cents {
  return mulDivHalfUp(balanceCents, aprBps, BPS_PER_WHOLE);
}

/** A share of an amount, given in basis points (300 = 3%), rounded half up to the cent. */
export function shareOfCents(amountCents: Cents, shareBps: Bps): Cents {
  return mulDivHalfUp(amountCents, shareBps, BPS_PER_WHOLE);
}
