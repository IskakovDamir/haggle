import { describe, expect, it } from "vitest";
import { simulateMinimumPayments } from "@/lib/engine";
import { testCall, testCard, testOutcome } from "@/components/call/test-fixtures";
import { addMonths } from "./dates";
import { debtFreeFor, loweredAprBps } from "./debt-free";

const TODAY = "2026-11-14";
const card = testCard();
const win = testCall({ outcome: testOutcome({ aprAfterBps: 1999 }) });

describe("loweredAprBps", () => {
  it("is null until a confirmed win lowers the rate", () => {
    expect(loweredAprBps(card, [])).toBeNull();
    expect(loweredAprBps(card, [testCall({ outcome: testOutcome({ result: "declined" }) })])).toBeNull();
    expect(loweredAprBps(card, [testCall({ outcome: testOutcome({ aprAfterBps: 1999, verified: false }) })])).toBeNull();
  });

  it("takes the rate from the latest win on this card", () => {
    const later = testCall({ id: "call-2", outcome: testOutcome({ aprAfterBps: 1799 }) });
    const otherCard = testCall({ id: "call-3", cardId: "capital-one", outcome: testOutcome({ aprAfterBps: 999 }) });
    expect(loweredAprBps(card, [win])).toBe(1999);
    expect(loweredAprBps(card, [win, later, otherCard])).toBe(1799);
  });

  it("ignores a rate that is not lower than the statement's", () => {
    expect(loweredAprBps(card, [testCall({ outcome: testOutcome({ aprAfterBps: 2724 }) })])).toBeNull();
  });
});

describe("debtFreeFor", () => {
  it("dates the minimum-only payoff from today", () => {
    const debtFree = debtFreeFor(card, [], TODAY);
    const expected = simulateMinimumPayments(card.balanceCents, card.purchaseAprBps);
    expect(debtFree.before).toEqual(expected);
    expect(debtFree.beforeDate).toBe(addMonths(TODAY, expected.months));
    expect(debtFree.aprAfterBps).toBeNull();
    expect(debtFree.after).toBeNull();
    expect(debtFree.afterDate).toBeNull();
  });

  it("runs the same simulation at the rate a call won", () => {
    const debtFree = debtFreeFor(card, [win], TODAY);
    const expected = simulateMinimumPayments(card.balanceCents, 1999);
    expect(debtFree.aprAfterBps).toBe(1999);
    expect(debtFree.after).toEqual(expected);
    expect(debtFree.afterDate).toBe(addMonths(TODAY, expected.months));
    expect(debtFree.after!.totalInterestCents).toBeLessThan(debtFree.before.totalInterestCents);
    expect(debtFree.after!.months).toBeLessThanOrEqual(debtFree.before.months);
  });

  it("shows that a steady payment ends the debt sooner than a shrinking minimum", () => {
    const { steady, before } = debtFreeFor(card, [], TODAY);
    expect(steady.payoff.paidOff).toBe(true);
    expect(steady.payoff.months).toBeLessThan(before.months);
    expect(steady.date).toBe(addMonths(TODAY, steady.payoff.months));
  });

  it("uses the lowered rate for the steady payment after a win", () => {
    const beforeWin = debtFreeFor(card, [], TODAY).steady;
    const afterWin = debtFreeFor(card, [win], TODAY).steady;
    expect(afterWin.paymentCents).toBeLessThan(beforeWin.paymentCents);
  });
});
