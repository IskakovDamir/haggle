// Money is integer cents everywhere. Format only here, only for display.

/** "$1,998.85" */
export function formatCents(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(Math.round(cents));
  const dollars = Math.floor(abs / 100).toLocaleString("en-US");
  const rest = String(abs % 100).padStart(2, "0");
  return `${sign}$${dollars}.${rest}`;
}

/** "$1,999" (rounded to the dollar, for hero numbers) */
export function formatDollars(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  return `${sign}$${Math.round(Math.abs(cents) / 100).toLocaleString("en-US")}`;
}

/** "$110" when whole, "$9.99" when not. For short copy. */
export function formatShort(cents: number): string {
  return cents % 100 === 0 ? formatDollars(cents) : formatCents(cents);
}

/** Parse "45", "45.5", "$1,200.00" into cents. Returns null when it is not a number. */
export function parseDollarsToCents(input: string): number | null {
  const cleaned = input.replace(/[$,\s]/g, "");
  if (!/^\d+(\.\d{0,2})?$/.test(cleaned)) return null;
  const [whole, frac = ""] = cleaned.split(".");
  return Number(whole) * 100 + Number(frac.padEnd(2, "0"));
}
