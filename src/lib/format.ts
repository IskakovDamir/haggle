// Display helpers for rates, dates and durations. Money formatting lives in money.ts.
import type { Bps, IsoDate } from "@/lib/types";

/** 2724 -> "27.24%" */
export function formatApr(bps: Bps): string {
  return `${(bps / 100).toFixed(2)}%`;
}

/** 630 -> "6.3" (points, no sign). Trailing zeros are dropped. */
export function formatPoints(bps: Bps): string {
  return String(Number((Math.abs(bps) / 100).toFixed(2)));
}

/** Today's calendar date in the visitor's timezone. Call it in the browser, not during render on the server. */
export function todayIso(now: Date = new Date()): IsoDate {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** "2026-11-14" -> "Nov 14, 2026". The date is treated as a calendar day, never shifted by timezone. */
export function formatDate(iso: IsoDate): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(
    new Date(Date.UTC(y, m - 1, d)),
  );
}

/** Add whole days to a calendar date. */
export function addDays(iso: IsoDate, days: number): IsoDate {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/** Whole days from one calendar date to another (negative when `to` is earlier). */
export function daysBetween(from: IsoDate, to: IsoDate): number {
  const parse = (iso: IsoDate) => {
    const [y, m, d] = iso.split("-").map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((parse(to) - parse(from)) / 86_400_000);
}

/** 280 -> "23 years 4 months", 14 -> "1 year 2 months", 9 -> "9 months". */
export function formatDuration(months: number): string {
  const years = Math.floor(months / 12);
  const rest = months % 12;
  const y = years === 0 ? "" : `${years} ${years === 1 ? "year" : "years"}`;
  const m = rest === 0 ? "" : `${rest} ${rest === 1 ? "month" : "months"}`;
  return [y, m].filter(Boolean).join(" ") || "0 months";
}
