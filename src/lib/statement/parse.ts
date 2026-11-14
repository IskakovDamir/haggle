// Turns text copied from a statement ("$8,400.00", "27.24%", "2026-12-01") into the integers the rest
// of the app works with. The model copies; this file converts. Nothing here guesses: text that is not
// a plain amount, rate or date comes back as null and the caller turns that into a warning.
import { parseDollarsToCents } from "@/lib/money";
import type { Bps, Cents, IsoDate, Issuer } from "@/lib/types";

/** "$8,400.00" -> 840000. A credit ("-$12.00", "$12.00 CR", "($12.00)") comes back negative. */
export function parseMoney(text: string): Cents | null {
  let rest = text.trim().replace(/\s*USD$/i, "");
  let negative = false;

  const credit = rest.match(/^(.*?)\s*CR$/i);
  const bracketed = rest.match(/^\((.*)\)$/);
  if (credit) {
    negative = true;
    rest = credit[1];
  } else if (bracketed) {
    negative = true;
    rest = bracketed[1];
  } else if (/^[-−]/.test(rest)) {
    negative = true;
    rest = rest.slice(1);
  }

  const cents = parseDollarsToCents(rest);
  if (cents === null) return null;
  return negative && cents !== 0 ? -cents : cents;
}

/** "27.24%" -> 2724. Accepts the "(v)" or "V" some statements print after a variable rate. */
export function parsePercent(text: string): Bps | null {
  const match = text.trim().match(/^(\d{1,3})(?:\.(\d{1,4}))?\s*%?\s*(?:\(?v\)?)?$/i);
  if (!match) return null;
  return Math.round(Number(`${match[1]}.${match[2] ?? "0"}`) * 100);
}

/** Accepts only a real calendar day written as YYYY-MM-DD. */
export function parseIsoDate(text: string): IsoDate | null {
  const match = text.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const [year, month, day] = match.slice(1).map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const real = date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
  return real ? `${match[1]}-${match[2]}-${match[3]}` : null;
}

/** "25", " 3 " -> the integer. Anything else is null. */
export function parseWholeNumber(text: string): number | null {
  const trimmed = text.trim();
  return /^\d{1,6}$/.test(trimmed) ? Number(trimmed) : null;
}

/** 13 to 19 digits, alone or in groups split by spaces or dashes: the shape of a card number. */
const CARD_NUMBER = /\d(?:[ -]?\d){12,18}/g;

/** Removes anything shaped like a full card number from free text. */
export function stripCardNumbers(text: string): string {
  return text.replace(CARD_NUMBER, "").replace(/\s{2,}/g, " ").trim();
}

/** The last four digits of whatever was printed ("XXXX XXXX XXXX 4417", "ending in 4417"). */
export function lastFourDigits(text: string): string | null {
  const digits = text.replace(/\D/g, "");
  return digits.length >= 4 ? digits.slice(-4) : null;
}

/** "MARIA T LOPEZ" -> "Maria". The agent only ever needs the first name. */
export function firstNameOf(fullName: string): string | null {
  const first = stripCardNumbers(fullName)
    .split(/\s+/)[0]
    ?.replace(/[^\p{L}'-]/gu, "");
  if (!first) return null;
  const shouting = first === first.toUpperCase();
  return shouting ? first[0] + first.slice(1).toLowerCase() : first;
}

const ISSUER_KEYWORDS: [Issuer, RegExp][] = [
  ["chase", /chase|jpmorgan/i],
  ["capital_one", /capital\s*one/i],
  ["citi", /citi/i],
  ["amex", /american\s*express|amex/i],
  ["discover", /discover/i],
  ["bank_of_america", /bank\s*of\s*america/i],
  ["wells_fargo", /wells\s*fargo/i],
];

/** Maps the printed bank name to the issuers the negotiator has a playbook for. */
export function issuerFromName(name: string): Issuer {
  return ISSUER_KEYWORDS.find(([, pattern]) => pattern.test(name))?.[0] ?? "other";
}
