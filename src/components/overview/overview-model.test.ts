import { describe, expect, it } from "vitest";
import { testCall, testCard, testCase, testOutcome } from "@/components/call/test-fixtures";
import { callResult, latestCalls, modeLabel, newCallHref, overviewFor } from "./overview-model";

const TODAY = "2026-11-14";
const capitalOne = testCard({
  id: "capital-one",
  issuer: "capital_one",
  issuerName: "Capital One",
  cardName: "Quicksilver",
  last4: "1234",
  balanceCents: 310_000,
  creditLimitCents: 400_000,
  purchaseAprBps: 2999,
  annualFeeCents: 9_500,
});

const chaseWin = testCall({
  startedAt: "2026-06-15T12:00:00.000Z",
  endedAt: "2026-06-15T12:06:00.000Z",
  outcome: testOutcome({ aprAfterBps: 1999 }),
  savings: { annualSavingsCents: 60_900, lines: [], feeCents: 12_180 },
});

describe("overviewFor", () => {
  it("adds up a case with no calls yet", () => {
    const overview = overviewFor(testCase({ cards: [testCard(), capitalOne] }), TODAY);
    // $8,400 at 27.24% ($2,288.16) plus $3,100 at 29.99% ($929.69).
    expect(overview.annualInterestCents).toBe(228_816 + 92_969);
    expect(overview.annualInterestBeforeCents).toBe(overview.annualInterestCents);
    expect(overview.savedCents).toBe(0);
    expect(overview.callsWon).toBe(0);
    expect(overview.callsInPlan).toBeGreaterThan(0);
    expect(overview.goalCents).toBe(overview.openValueCents);
    expect(overview.savedPct).toBe(0);
    expect(overview.nextCall?.id).toBe("chase:apr_reduction");
    expect(overview.cards.map((row) => [row.card.id, row.won, row.nextCall])).toEqual([
      ["chase", false, true],
      ["capital-one", false, false],
    ]);
  });

  it("counts a win: lower interest now, savings, and the next call moves on", () => {
    const overview = overviewFor(testCase({ cards: [testCard(), capitalOne], calls: [chaseWin] }), TODAY);
    // $8,400 at 19.99% is $1,679.16 a year.
    expect(overview.annualInterestCents).toBe(167_916 + 92_969);
    expect(overview.annualInterestBeforeCents).toBe(228_816 + 92_969);
    expect(overview.savedCents).toBe(60_900);
    expect(overview.wins).toBe(1);
    expect(overview.callsWon).toBe(1);
    expect(overview.callsWonPct).toBeCloseTo((1 / overview.callsInPlan) * 100);
    expect(overview.goalCents).toBe(60_900 + overview.openValueCents);
    expect(overview.savedPct).toBeCloseTo((60_900 / overview.goalCents) * 100);
    const chase = overview.cards[0];
    expect([chase.aprBeforeBps, chase.aprAfterBps, chase.won]).toEqual([2724, 1999, true]);
    expect(overview.nextCall?.id).not.toBe("chase:apr_reduction");
    expect(overview.chart.marker?.label).toBe("Chase call · 27.24% → 19.99%");
  });

  it("keeps the next steps short and says how many there are", () => {
    const overview = overviewFor(testCase({ cards: [testCard(), capitalOne] }), TODAY);
    expect(overview.steps.length).toBeLessThanOrEqual(3);
    expect(overview.stepCount).toBeGreaterThan(3);
  });

  it("notices sample cards and missed payments", () => {
    const sample = testCard({
      id: "sample-maria-chase",
      missedPayment: { reason: "forgot", note: "", daysLate: null, paidSince: false, firstInYear: true, aprBeforeBps: null },
    });
    const overview = overviewFor(testCase({ cards: [sample] }), TODAY);
    expect(overview.hasSample).toBe(true);
    expect(overview.cards[0].sample).toBe(true);
    expect(overview.cards[0].missedPayment).toBe(true);
  });
});

describe("newCallHref", () => {
  it("goes to /start without cards", () => {
    expect(newCallHref(null, TODAY)).toBe("/start");
    expect(newCallHref(testCase({ cards: [] }), TODAY)).toBe("/start");
  });

  it("goes to the next open call", () => {
    expect(newCallHref(testCase(), TODAY)).toBe("/call?step=chase%3Aapr_reduction");
  });

  it("goes to the call list when every call is won", () => {
    // A card with no balance and no fee has nothing to call about.
    expect(newCallHref(testCase({ cards: [testCard({ balanceCents: 0, creditLimitCents: null })] }), TODAY)).toBe("/calls");
  });
});

describe("latestCalls", () => {
  it("puts the newest first and keeps a few", () => {
    const calls = ["2026-11-01", "2026-11-12", "2026-11-05", "2026-11-13"].map((day, i) =>
      testCall({ id: `c${i}`, startedAt: `${day}T12:00:00.000Z` }),
    );
    expect(latestCalls(calls, 3).map((call) => call.id)).toEqual(["c3", "c1", "c2"]);
  });
});

describe("callResult", () => {
  it("names how the call ended", () => {
    expect(callResult(chaseWin)).toEqual({ text: "Win", win: true });
    expect(callResult(testCall({ outcome: testOutcome({ result: "partial" }) }))).toEqual({ text: "Partial win", win: true });
    expect(callResult(testCall({ outcome: testOutcome({ result: "declined" }) })).text).toBe("Declined");
    expect(callResult(testCall({ outcome: testOutcome({ verified: false }) })).text).toBe("Not confirmed");
    expect(callResult(testCall({ outcome: testOutcome({ result: "unclear" }) })).text).toBe("No answer");
    expect(callResult(testCall()).text).toBe("No result");
    expect(callResult(testCall({ endedAt: null })).text).toBe("Not finished");
  });
});

describe("modeLabel", () => {
  it("says how the call was made", () => {
    expect(modeLabel("voice")).toBe("voice");
    expect(modeLabel("text")).toBe("typed");
    expect(modeLabel("phone")).toBe("phone");
  });
});
