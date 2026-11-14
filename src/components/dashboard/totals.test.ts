import { describe, expect, it } from "vitest";
import { testCall, testOutcome } from "@/components/call/test-fixtures";
import { countedWins, feeIsDue, totalsFor } from "./totals";

const aprWin = testCall({
  id: "apr-win",
  outcome: testOutcome({ aprAfterBps: 1999 }),
  savings: { annualSavingsCents: 60_900, lines: [], feeCents: 12_180 },
  paid: { amountCents: 12_180, sessionId: "cs_test_1", at: "2026-11-14T12:10:00.000Z" },
});
const feeWin = testCall({
  id: "fee-win",
  goal: "annual_fee_waiver",
  outcome: testOutcome({ annualFeeWaivedCents: 9500 }),
  savings: { annualSavingsCents: 9500, lines: [], feeCents: 1900 },
});
const declined = testCall({
  id: "declined",
  cardId: "capital-one",
  outcome: testOutcome({ result: "declined" }),
  savings: { annualSavingsCents: 0, lines: [], feeCents: 0 },
});
const unconfirmed = testCall({
  id: "unconfirmed",
  cardId: "capital-one",
  outcome: testOutcome({ result: "unclear", verified: false }),
  savings: { annualSavingsCents: 0, lines: [], feeCents: 0 },
});

describe("totalsFor", () => {
  it("is all zeros before the first call", () => {
    expect(totalsFor([])).toEqual({ savedCents: 0, paidCents: 0, unpaidFeeCents: 0, wins: 0 });
  });

  it("adds up savings from wins and the fees actually paid", () => {
    expect(totalsFor([aprWin, feeWin, declined, unconfirmed])).toEqual({
      savedCents: 70_400,
      paidCents: 12_180,
      unpaidFeeCents: 1900,
      wins: 2,
    });
  });

  it("counts a step that was won twice once, with its latest result", () => {
    const better = testCall({
      id: "apr-win-2",
      outcome: testOutcome({ aprAfterBps: 1799 }),
      savings: { annualSavingsCents: 77_700, lines: [], feeCents: 15_540 },
    });
    const totals = totalsFor([aprWin, better]);
    expect(totals.savedCents).toBe(77_700);
    expect(totals.wins).toBe(1);
    // The payment for the first win was still made.
    expect(totals.paidCents).toBe(12_180);
    expect(countedWins([aprWin, better]).map((call) => call.id)).toEqual(["apr-win-2"]);
  });

  it("does not count a win that has no stored savings", () => {
    expect(totalsFor([testCall({ outcome: testOutcome({ aprAfterBps: 1999 }) })]).savedCents).toBe(0);
  });
});

describe("feeIsDue", () => {
  it("is true only for an unpaid win with a fee large enough to charge", () => {
    expect(feeIsDue(feeWin)).toBe(true);
    expect(feeIsDue(aprWin)).toBe(false);
    expect(feeIsDue(declined)).toBe(false);

    const tinyWin = testCall({
      outcome: testOutcome({ statementCreditCents: 200 }),
      savings: { annualSavingsCents: 200, lines: [], feeCents: 40 },
    });
    expect(feeIsDue(tinyWin)).toBe(false);
  });
});
