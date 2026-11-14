// The shareable win card's data. There is no server storage, so the link carries the result itself,
// signed by sign.ts. Every number here comes from a verified CallOutcome and the engine's Savings:
// this file only copies them, it never computes a figure of its own.
import type { Bps, CallOutcome, CardAccount, Cents, IsoDate, Savings } from "@/lib/types";

/** One thing the bank granted. "credit" is a statement credit; the outcome does not say what it was for. */
export type ShareWin =
  | { kind: "late_fee"; amountCents: Cents }
  | { kind: "apr"; fromBps: Bps; toBps: Bps; /** True when the rate went back to what it was before a missed payment. */ restored: boolean }
  | { kind: "annual_fee"; amountCents: Cents }
  | { kind: "credit"; amountCents: Cents };

export type SharePayload = {
  v: 1;
  /** Bank name only. Never the cardholder's name or the card's last four digits. */
  bank: string;
  wins: ShareWin[];
  annualSavingsCents: Cents;
  /** Practice call or sample data. The card says "Practice call" when true. */
  practice: boolean;
  date: IsoDate;
};

/** The card fields a share needs. Nothing that identifies the cardholder. */
export type ShareCard = Pick<CardAccount, "purchaseAprBps" | "balanceCents" | "annualFeeCents"> & { aprBeforeMissBps: Bps | null };

/** The wins a verified outcome contains, most valuable kind first, as the result card orders them. */
export function winsFromOutcome(card: ShareCard, outcome: CallOutcome): ShareWin[] {
  const wins: ShareWin[] = [];
  if (outcome.aprAfterBps !== null && outcome.aprAfterBps < card.purchaseAprBps) {
    const restored = card.aprBeforeMissBps !== null && outcome.aprAfterBps <= card.aprBeforeMissBps;
    wins.push({ kind: "apr", fromBps: card.purchaseAprBps, toBps: outcome.aprAfterBps, restored });
  }
  if ((outcome.annualFeeWaivedCents ?? 0) > 0) wins.push({ kind: "annual_fee", amountCents: outcome.annualFeeWaivedCents! });
  if ((outcome.lateFeeRefundCents ?? 0) > 0) wins.push({ kind: "late_fee", amountCents: outcome.lateFeeRefundCents! });
  if ((outcome.statementCreditCents ?? 0) > 0) wins.push({ kind: "credit", amountCents: outcome.statementCreditCents! });
  // The late fee leads when there is one: it is the headline of a missed-payment call.
  return wins.sort((a, b) => (a.kind === "late_fee" ? -1 : b.kind === "late_fee" ? 1 : 0));
}

function sameWin(a: ShareWin, b: ShareWin): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export class ShareError extends Error {}

/**
 * The payload for one verified win. Rejects an outcome code did not verify, a call that won nothing,
 * any requested win the outcome does not contain, and savings that do not match the engine's.
 */
export function buildPayload(input: {
  bank: string;
  card: ShareCard;
  outcome: CallOutcome;
  savings: Savings;
  practice: boolean;
  date: IsoDate;
  wins?: ShareWin[];
}): SharePayload {
  const { outcome, savings } = input;
  if (!outcome.verified) throw new ShareError("The outcome was not verified");
  if (outcome.result !== "won" && outcome.result !== "partial") throw new ShareError("The call did not win anything");
  const contained = winsFromOutcome(input.card, outcome);
  const wins = input.wins ?? contained;
  for (const win of wins) {
    if (!contained.some((c) => sameWin(c, win))) throw new ShareError(`The outcome does not contain this win: ${win.kind}`);
  }
  if (wins.length === 0) throw new ShareError("There is no win to share");
  const bank = input.bank.trim().slice(0, 40);
  if (!bank) throw new ShareError("Bank name is missing");
  return { v: 1, bank, wins, annualSavingsCents: savings.annualSavingsCents, practice: input.practice, date: input.date };
}

// ---- compact encoding: short keys and arrays keep the link short ----------------------------

type Packed = { v: 1; b: string; w: (["l" | "f" | "c", number] | ["a", number, number, 0 | 1])[]; s: number; p: 0 | 1; d: string };

function pack(p: SharePayload): Packed {
  return {
    v: 1,
    b: p.bank,
    w: p.wins.map((win) => {
      if (win.kind === "apr") return ["a", win.fromBps, win.toBps, win.restored ? 1 : 0] as ["a", number, number, 0 | 1];
      const code = win.kind === "late_fee" ? "l" : win.kind === "annual_fee" ? "f" : "c";
      return [code, win.amountCents] as ["l" | "f" | "c", number];
    }),
    s: p.annualSavingsCents,
    p: p.practice ? 1 : 0,
    d: p.date,
  };
}

const int = (n: unknown): n is number => typeof n === "number" && Number.isInteger(n) && n >= 0 && n < 1e12;

function unpack(raw: unknown): SharePayload | null {
  if (typeof raw !== "object" || raw === null) return null;
  const p = raw as Partial<Packed>;
  if (p.v !== 1 || typeof p.b !== "string" || !p.b || p.b.length > 40 || !Array.isArray(p.w) || p.w.length === 0 || p.w.length > 4) return null;
  if (!int(p.s) || (p.p !== 0 && p.p !== 1) || typeof p.d !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(p.d)) return null;
  const wins: ShareWin[] = [];
  for (const w of p.w) {
    if (!Array.isArray(w)) return null;
    if (w[0] === "a" && int(w[1]) && int(w[2]) && (w[3] === 0 || w[3] === 1)) wins.push({ kind: "apr", fromBps: w[1], toBps: w[2], restored: w[3] === 1 });
    else if (w[0] === "l" && int(w[1])) wins.push({ kind: "late_fee", amountCents: w[1] });
    else if (w[0] === "f" && int(w[1])) wins.push({ kind: "annual_fee", amountCents: w[1] });
    else if (w[0] === "c" && int(w[1])) wins.push({ kind: "credit", amountCents: w[1] });
    else return null;
  }
  return { v: 1, bank: p.b, wins, annualSavingsCents: p.s, practice: p.p === 1, date: p.d };
}

function toBase64Url(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(text: string): Uint8Array | null {
  if (!/^[A-Za-z0-9_-]*$/.test(text)) return null;
  try {
    const s = atob(text.replace(/-/g, "+").replace(/_/g, "/"));
    return Uint8Array.from(s, (c) => c.charCodeAt(0));
  } catch {
    return null;
  }
}

/** base64url of the compact JSON. */
export function encodePayload(payload: SharePayload): string {
  return toBase64Url(new TextEncoder().encode(JSON.stringify(pack(payload))));
}

/** The payload, or null for anything malformed. Never throws. */
export function decodePayload(encoded: string): SharePayload | null {
  const bytes = fromBase64Url(encoded);
  if (!bytes || bytes.length > 2000) return null;
  try {
    return unpack(JSON.parse(new TextDecoder().decode(bytes)));
  } catch {
    return null;
  }
}

export { toBase64Url, fromBase64Url };
