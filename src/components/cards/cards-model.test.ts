import { describe, expect, it } from "vitest";
import { testCall, testCard, testCase, testOutcome } from "@/components/call/test-fixtures";
import { cardsView } from "./cards-model";

const TODAY = "2026-11-14";
const capitalOne = testCard({ id: "capital-one", issuerName: "Capital One", balanceCents: 310_000, purchaseAprBps: 2999, annualFeeCents: 9_500 });

describe("cardsView", () => {
  it("lists every card with its numbers and open calls", () => {
    const view = cardsView(testCase({ cards: [testCard(), capitalOne] }), TODAY);
    expect(view.entries.map((entry) => entry.card.id)).toEqual(["chase", "capital-one"]);
    expect(view.totalBalanceCents).toBe(840_000 + 310_000);
    expect(view.entries[0].analysis.annualInterestCents).toBe(228_816);
    expect(view.entries[0].aprAfterBps).toBeNull();
    expect(view.entries[0].wins).toEqual([]);
    expect(view.entries[0].openCalls).toBeGreaterThan(0);
  });

  it("shows a card as it stands after its wins", () => {
    const rate = testCall({ outcome: testOutcome({ aprAfterBps: 1999 }), savings: { annualSavingsCents: 60_900, lines: [], feeCents: 12_180 } });
    const fee = testCall({
      id: "call-2",
      cardId: "capital-one",
      goal: "annual_fee_waiver",
      outcome: testOutcome({ annualFeeWaivedCents: 9_500 }),
      savings: { annualSavingsCents: 9_500, lines: [], feeCents: 1_900 },
    });
    const view = cardsView(testCase({ cards: [testCard(), capitalOne], calls: [rate, fee] }), TODAY);
    const [chase, capOne] = view.entries;
    expect([chase.aprBeforeBps, chase.aprAfterBps, chase.card.purchaseAprBps]).toEqual([2724, 1999, 1999]);
    expect(chase.analysis.annualInterestCents).toBe(167_916);
    expect(chase.wins).toEqual([{ callId: "call-1", goal: "apr_reduction", date: TODAY, savedCents: 60_900 }]);
    expect(chase.savedCents).toBe(60_900);
    expect(capOne.card.annualFeeCents).toBe(0);
    expect(capOne.savedCents).toBe(9_500);
  });
});
