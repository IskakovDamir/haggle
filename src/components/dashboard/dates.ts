// Calendar-date helpers the dashboard needs on top of src/lib/format.ts.
import { todayIso } from "@/lib/format";
import type { IsoDate } from "@/lib/types";

/** Add whole months to a calendar date. Jan 31 plus one month is the last day of February, not March 3. */
export function addMonths(iso: IsoDate, months: number): IsoDate {
  const [y, m, d] = iso.split("-").map(Number);
  const lastDayOfTarget = new Date(Date.UTC(y, m + months, 0)).getUTCDate();
  return new Date(Date.UTC(y, m - 1 + months, Math.min(d, lastDayOfTarget))).toISOString().slice(0, 10);
}

/** The visitor's calendar date for a stored timestamp such as CallRecord.endedAt. */
export function localDateOf(timestamp: string): IsoDate {
  return todayIso(new Date(timestamp));
}

/** The later of two calendar dates. ISO dates sort as text. */
export function laterOf(a: IsoDate, b: IsoDate): IsoDate {
  return a > b ? a : b;
}
