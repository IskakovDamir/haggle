import { describe, expect, it } from "vitest";
import { testCall, testCard, testOutcome } from "@/components/call/test-fixtures";
import { interestSeries, rateCuts } from "./interest-series";

const TODAY = "2026-11-14";
const chase = testCard();
const capitalOne = testCard({ id: "capital-one", issuer: "capital_one", issuerName: "Capital One", balanceCents: 310_000, purchaseAprBps: 2999 });

/** A confirmed call made at noon UTC on the given day, so the calendar day is the same in any timezone near UTC. */
const callOn = (day: string, overrides: Parameters<typeof testCall>[0] = {}) =>
  testCall({ startedAt: `${day}T12:00:00.000Z`, endedAt: `${day}T12:06:00.000Z`, ...overrides });

const juneWin = callOn("2026-06-15", { outcome: testOutcome({ aprAfterBps: 1999 }) });

describe("interestSeries", () => {
  it("charges every month at the statement's rate when nothing was won", () => {
    const series = interestSeries([chase], [], TODAY);
    expect(series.year).toBe(2026);
    expect(series.months).toHaveLength(12);
    // $8,400 at 27.24% is $190.68 a month.
    expect(new Set(series.months.map((month) => month.interestCents))).toEqual(new Set([19_068]));
    expect(series.months.every((month) => !month.lowered && month.heightPct === 100)).toBe(true);
    expect(series.monthlyCutCents).toBe(0);
    expect(series.marker).toBeNull();
  });

  it("drops to the new rate from the win's month on", () => {
    const series = interestSeries([chase], [juneWin], TODAY);
    const byMonth = series.months.map((month) => month.interestCents);
    expect(byMonth.slice(0, 5)).toEqual(Array(5).fill(19_068));
    // $8,400 at 19.99% is $139.93 a month.
    expect(byMonth.slice(5)).toEqual(Array(7).fill(13_993));
    expect(series.months[4].lowered).toBe(false);
    expect(series.months[5].lowered).toBe(true);
    expect(series.baselineMonthlyCents).toBe(19_068);
    expect(series.currentMonthlyCents).toBe(13_993);
    expect(series.monthlyCutCents).toBe(5_075);
    expect(series.months[5].heightPct).toBe(73.4);
  });

  it("names the win on its month", () => {
    expect(interestSeries([chase], [juneWin], TODAY).marker).toEqual({ month: 6, label: "Call · 27.24% → 19.99%" });
  });

  it("names the bank when there is more than one card", () => {
    expect(interestSeries([chase, capitalOne], [juneWin], TODAY).marker?.label).toBe("Chase call · 27.24% → 19.99%");
  });

  it("marks the current month and the months still ahead", () => {
    const series = interestSeries([chase], [], TODAY);
    expect(series.months.filter((month) => month.current).map((month) => month.name)).toEqual(["Nov"]);
    expect(series.months.filter((month) => month.future).map((month) => month.name)).toEqual(["Dec"]);
  });

  it("applies a win from last year to every month", () => {
    const lastYear = callOn("2025-09-10", { outcome: testOutcome({ aprAfterBps: 1999 }) });
    const series = interestSeries([chase], [lastYear], TODAY);
    expect(series.months.every((month) => month.interestCents === 13_993 && month.lowered)).toBe(true);
    // The win was not this year, so the chart does not point at a month.
    expect(series.marker).toBeNull();
  });

  it("ignores calls that did not lower the rate, or were not confirmed", () => {
    const declined = callOn("2026-03-02", { outcome: testOutcome({ result: "declined", aprAfterBps: 1999 }) });
    const unconfirmed = callOn("2026-03-03", { outcome: testOutcome({ aprAfterBps: 1999, verified: false }) });
    const higher = callOn("2026-03-04", { outcome: testOutcome({ aprAfterBps: 2999 }) });
    const series = interestSeries([chase], [declined, unconfirmed, higher], TODAY);
    expect(series.months.every((month) => month.interestCents === 19_068)).toBe(true);
  });

  it("adds every card together", () => {
    const series = interestSeries([chase, capitalOne], [], TODAY);
    // $190.68 plus $3,100 at 29.99% ($77.47).
    expect(series.months[0].interestCents).toBe(19_068 + 7_747);
  });

  it("draws nothing for cards that charge no interest", () => {
    const series = interestSeries([testCard({ balanceCents: 0 })], [], TODAY);
    expect(series.months.every((month) => month.heightPct === 0 && month.interestCents === 0)).toBe(true);
  });
});

describe("rateCuts", () => {
  it("keeps only cuts that go lower than the rate before them", () => {
    const first = callOn("2026-04-01", { id: "a", outcome: testOutcome({ aprAfterBps: 2299 }) });
    const notLower = callOn("2026-05-01", { id: "b", outcome: testOutcome({ aprAfterBps: 2499 }) });
    const second = callOn("2026-06-01", { id: "c", outcome: testOutcome({ aprAfterBps: 1999 }) });
    expect(rateCuts([chase], [second, notLower, first]).map((cut) => [cut.callId, cut.beforeBps, cut.afterBps])).toEqual([
      ["a", 2724, 2299],
      ["c", 2299, 1999],
    ]);
  });
});
