import { describe, expect, it } from "vitest";
import { testCard, testCase } from "@/components/call/test-fixtures";
import { shellData } from "./shell-model";

const TODAY = "2026-11-14";

describe("shellData", () => {
  it("greets a visitor with no case and sends New call to /start", () => {
    expect(shellData(null, TODAY)).toEqual({ name: null, initial: "H", alertCount: 0, chip: null, newCallHref: "/start" });
  });

  it("names the holder, counts the alerts and points New call at the next call", () => {
    const card = testCard({ promo: { aprBps: 0, endsOn: "2026-12-25" } });
    const data = shellData(testCase({ cards: [card] }), TODAY);
    expect(data.name).toBe("Maria");
    expect(data.initial).toBe("M");
    expect(data.alertCount).toBeGreaterThan(0);
    expect(data.chip?.short).toBe("Chase promo ends in 41 days");
    expect(data.newCallHref).toBe("/call?step=chase%3Aapr_reduction");
  });

  it("stays calm when the engine cannot read a card", () => {
    const broken = testCard({ balanceCents: Number.NaN, purchaseAprBps: Number.NaN });
    const data = shellData(testCase({ cards: [broken] }), TODAY);
    expect(data.name).toBe("Maria");
    expect(typeof data.alertCount).toBe("number");
    expect(data.newCallHref.length).toBeGreaterThan(0);
  });
});
