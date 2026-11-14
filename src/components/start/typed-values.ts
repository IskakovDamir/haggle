// What a person types into the confirm form, turned into the integers the app stores:
// dollars become cents, percentages become basis points. Pure functions, no rounding through floats.
// Nothing here guesses. Text that is not a plain amount, rate or date comes back as "invalid" with a
// sentence the form can print under the field.
import type { Bps, Cents, IsoDate } from "@/lib/types";

/** The result of reading one field: nothing typed, a value, or a sentence about what is wrong. */
export type Typed<T> = { kind: "empty" } | { kind: "value"; value: T } | { kind: "invalid"; message: string };

const EMPTY = { kind: "empty" } as const;
const value = <T>(result: T): Typed<T> => ({ kind: "value", value: result });
const invalid = (message: string): Typed<never> => ({ kind: "invalid", message });

/** No card balance, limit or fee is anywhere near this. Above it, a digit was most likely doubled. */
export const MAX_DOLLARS = 10_000_000;
const MAX_RATE_BPS = 10_000;
const EARLIEST_MEMBER_YEAR = 1950;

/** Digits with optional thousands commas: "8400", "8,400", "1,234,567". */
const WHOLE = /^(\d+|\d{1,3}(,\d{3})+)$/;

/**
 * Splits "8,400.5" into its whole and fractional digits. A single comma followed by one or two digits
 * ("8400,50") is read as a decimal comma, which is how much of the world types it; it cannot be
 * confused with a thousands comma, because that one is always followed by three digits.
 */
function splitDecimal(text: string): { whole: string; fraction: string } | null {
  const decimalComma = text.match(/^(\d+),(\d{1,2})$/);
  if (decimalComma) return { whole: decimalComma[1], fraction: decimalComma[2] };

  const [typedWhole, fraction = "", ...extra] = text.split(".");
  // ".50" is fifty cents.
  const whole = typedWhole === "" && fraction !== "" ? "0" : typedWhole;
  if (extra.length > 0 || !WHOLE.test(whole) || !/^\d*$/.test(fraction)) return null;
  return { whole: whole.replace(/,/g, ""), fraction };
}

/** "$8,400", "8400.5", "8 400,50" -> cents. */
export function typedDollars(text: string): Typed<Cents> {
  const cleaned = text.replace(/\s/g, "").replace(/^\$/, "");
  if (cleaned === "") return EMPTY;
  if (/^[-−(]/.test(cleaned)) return invalid("Type the amount without a minus sign.");

  const parts = splitDecimal(cleaned);
  if (!parts) return invalid("Type a dollar amount, like 8,400.00.");
  if (parts.fraction.length > 2) return invalid("Use dollars and cents, like 8,400.00.");

  const dollars = Number(parts.whole);
  if (dollars > MAX_DOLLARS) return invalid("That amount looks too large. Check it against the statement.");
  return value(dollars * 100 + Number(parts.fraction.padEnd(2, "0")));
}

/** "27.24", "27.24%", "27,24 %" -> basis points. */
export function typedPercent(text: string): Typed<Bps> {
  const cleaned = text.replace(/\s/g, "").replace(/%$/, "");
  if (cleaned === "") return EMPTY;
  if (/^[-−]/.test(cleaned)) return invalid("Type the rate without a minus sign.");

  const match = cleaned.match(/^(\d{1,3})(?:[.,](\d*))?$/);
  if (!match) return invalid("Type a rate, like 27.24.");
  const fraction = match[2] ?? "";
  if (fraction.length > 2) return invalid("Use at most two decimals, like 27.24.");

  const bps = Number(match[1]) * 100 + Number(fraction.padEnd(2, "0"));
  if (bps > MAX_RATE_BPS) return invalid("A rate is a percentage between 0 and 100.");
  return value(bps);
}

/** A real calendar day written as YYYY-MM-DD, which is what a date input produces. */
export function typedDate(text: string): Typed<IsoDate> {
  const trimmed = text.trim();
  if (trimmed === "") return EMPTY;
  const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return invalid("Type the date as YYYY-MM-DD.");

  const [year, month, day] = match.slice(1).map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const real = date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
  return real ? value(trimmed) : invalid("That day is not on the calendar.");
}

/** A whole number from 0 to `max`, for "late payments in the last 12 months". */
export function typedCount(text: string, max: number): Typed<number> {
  const trimmed = text.trim();
  if (trimmed === "") return EMPTY;
  if (!/^\d{1,4}$/.test(trimmed) || Number(trimmed) > max) return invalid(`Type a whole number from 0 to ${max}.`);
  return value(Number(trimmed));
}

/** The year in a "member since" line. It cannot be later than `latestYear`. */
export function typedYear(text: string, latestYear: number): Typed<number> {
  const trimmed = text.trim();
  if (trimmed === "") return EMPTY;
  const year = /^\d{4}$/.test(trimmed) ? Number(trimmed) : null;
  if (year === null || year < EARLIEST_MEMBER_YEAR || year > latestYear) {
    return invalid(`Type a year between ${EARLIEST_MEMBER_YEAR} and ${latestYear}.`);
  }
  return value(year);
}

/** Exactly four digits. A longer number is refused, so a full card number never gets stored. */
export function typedLast4(text: string): Typed<string> {
  const cleaned = text.replace(/[\s-]/g, "");
  if (cleaned === "") return EMPTY;
  if (/^\d{5,}$/.test(cleaned)) return invalid("Only the last four digits. We never keep the full card number.");
  return /^\d{4}$/.test(cleaned) ? value(cleaned) : invalid("Type the last four digits of the card number.");
}

/** Free text, trimmed. Something shaped like a card number is refused for the same reason as above. */
export function typedText(text: string, maxLength = 60): Typed<string> {
  const trimmed = text.trim().replace(/\s+/g, " ");
  if (trimmed === "") return EMPTY;
  if (/\d(?:[ -]?\d){12,}/.test(trimmed)) return invalid("Leave the card number out. The last four digits are enough.");
  if (trimmed.length > maxLength) return invalid(`Keep it under ${maxLength} characters.`);
  return value(trimmed);
}

/** 840000 -> "8,400.00", the text an amount field starts with. null (unknown) is an empty field. */
export function dollarsForEditing(cents: Cents | null): string {
  if (cents === null) return "";
  const whole = Math.floor(cents / 100).toLocaleString("en-US");
  return `${whole}.${String(cents % 100).padStart(2, "0")}`;
}

/** 2724 -> "27.24", the text a rate field starts with. */
export function percentForEditing(bps: Bps | null): string {
  if (bps === null) return "";
  return `${Math.floor(bps / 100)}.${String(bps % 100).padStart(2, "0")}`;
}
