import { describe, expect, it } from "vitest";
import type { CallOutcome, Savings } from "@/lib/types";
import { ShareError, buildPayload, decodePayload, encodePayload, winsFromOutcome, type ShareCard, type SharePayload } from "./payload";
import { cardStatus, readToken, signPayload } from "./sign";
import { footerLabel, savingsLine, shareText, winLine } from "./text";

const SECRET = "test-secret-for-vitest";

// Maria's Chase card after a missed payment: the rate went to 27.24% and she wants her old one back.
const card: ShareCard = { purchaseAprBps: 2999, balanceCents: 840_000, annualFeeCents: 0, aprBeforeMissBps: 2724 };

const outcome: CallOutcome = {
  result: "won",
  aprAfterBps: 2724,
  annualFeeWaivedCents: null,
  lateFeeRefundCents: 4000,
  creditLimitAfterCents: null,
  statementCreditCents: null,
  followUp: null,
  evidence: [{ quote: "I can refund the $40 late fee", turnIndex: 1 }],
  verified: true,
};

const savings: Savings = { annualSavingsCents: 27_100, lines: [], feeCents: 5_420 };

const payload: SharePayload = buildPayload({ bank: "Chase", card, outcome, savings, practice: true, date: "2026-11-15" });

describe("share payload", () => {
  it("round-trips through the link encoding", () => {
    const encoded = encodePayload(payload);
    expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(encoded.length).toBeLessThan(120);
    expect(decodePayload(encoded)).toEqual(payload);
  });

  it("takes every win from the outcome, late fee first, nothing else", () => {
    expect(payload.wins).toEqual([
      { kind: "late_fee", amountCents: 4000 },
      { kind: "apr", fromBps: 2999, toBps: 2724, restored: true },
    ]);
    expect(payload.annualSavingsCents).toBe(27_100);
    expect(JSON.stringify(payload)).not.toMatch(/last4|Maria/);
  });

  it("rejects a win the verified outcome does not contain", () => {
    const forged = [{ kind: "late_fee" as const, amountCents: 9900 }];
    expect(() => buildPayload({ bank: "Chase", card, outcome, savings, practice: true, date: "2026-11-15", wins: forged })).toThrow(ShareError);
    const extra = [...winsFromOutcome(card, outcome), { kind: "annual_fee" as const, amountCents: 9500 }];
    expect(() => buildPayload({ bank: "Chase", card, outcome, savings, practice: true, date: "2026-11-15", wins: extra })).toThrow(ShareError);
  });

  it("rejects an outcome code did not verify, and a call that won nothing", () => {
    expect(() => buildPayload({ bank: "Chase", card, outcome: { ...outcome, verified: false }, savings, practice: true, date: "2026-11-15" })).toThrow(ShareError);
    expect(() => buildPayload({ bank: "Chase", card, outcome: { ...outcome, result: "declined" }, savings, practice: true, date: "2026-11-15" })).toThrow(ShareError);
  });

  it("returns null for malformed links instead of throwing", () => {
    expect(decodePayload("not base64!")).toBeNull();
    expect(decodePayload(encodePayload(payload).slice(0, 20))).toBeNull();
  });
});

describe("share signature", () => {
  it("verifies a signed token", async () => {
    const token = await signPayload(payload, SECRET);
    const read = await readToken(token, SECRET);
    expect(read?.signed).toBe(true);
    expect(read && cardStatus(read)).toBe("practice");
    expect(cardStatus({ payload: { ...payload, practice: false }, signed: true })).toBe("verified");
  });

  it("a token with one changed digit fails and renders as Unverified", async () => {
    const real = await signPayload({ ...payload, practice: false }, SECRET);
    const [body, sig] = real.split(".");
    const json = new TextDecoder().decode(Uint8Array.from(atob(body.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0)));
    const changed = json.replace("27100", "97100");
    expect(changed).not.toBe(json);
    const forgedBody = btoa(changed).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    const read = await readToken(`${forgedBody}.${sig}`, SECRET);
    expect(read?.signed).toBe(false);
    expect(footerLabel(cardStatus(read!))).toBe("Unverified");
  });

  it("without a secret, links are unsigned and say Unverified", async () => {
    const token = await signPayload(payload, undefined);
    expect(token).not.toContain(".");
    const read = await readToken(token, undefined);
    expect(footerLabel(cardStatus(read!))).toBe("Unverified");
  });
});

describe("share text", () => {
  it("formats cents and basis points through the shared formatters", () => {
    expect(winLine({ kind: "late_fee", amountCents: 4000 })).toBe("Late fee $40 refunded");
    expect(winLine({ kind: "apr", fromBps: 2999, toBps: 2724, restored: true })).toBe("APR back to 27.24%");
    expect(winLine({ kind: "apr", fromBps: 2999, toBps: 2299, restored: false })).toBe("APR down from 29.99% to 22.99%");
    expect(savingsLine(payload)).toBe("$271");
  });

  it("never claims Haggle called the bank on a practice call", () => {
    expect(shareText(payload)).toBe("I tried Haggle in a practice call with Chase: late fee refunded and APR back to 27.24%. That would save $271 in the first year.");
    expect(shareText({ ...payload, practice: false })).toBe("Haggle called Chase for me. Late fee refunded, APR back to 27.24%. Saves $271 in the first year.");
  });
});
