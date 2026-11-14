import type { Cents } from "@/lib/types";
import { mulDivHalfUp } from "./math";

/** Balance / limit as a percentage with one decimal. null when the limit is unknown. */
export function utilizationPct(balanceCents: Cents, creditLimitCents: Cents | null): number | null {
  if (creditLimitCents === null || !(creditLimitCents >= 1)) return null;
  const tenthsOfPercent = mulDivHalfUp(balanceCents, 1000, Math.round(creditLimitCents));
  return tenthsOfPercent / 10;
}
