import { describe, expect, it } from "vitest";
import { callHref, parseStepId, resolveCall } from "./resolve-call";
import { testCall, testCard, testCase, testOutcome } from "./test-fixtures";

const TODAY = "2026-11-14";

describe("parseStepId", () => {
  it("splits a step id into the card and the kind of ask", () => {
    expect(parseStepId("chase:apr_reduction")).toEqual({ cardId: "chase", kind: "apr_reduction" });
  });

  it("splits on the last colon, so a card id may contain one", () => {
    expect(parseStepId("card:7:annual_fee_waiver")).toEqual({ cardId: "card:7", kind: "annual_fee_waiver" });
  });

  it("refuses anything that is not a known step", () => {
    for (const bad of [null, "", "chase", ":apr_reduction", "chase:", "chase:free_money"]) {
      expect(parseStepId(bad)).toBeNull();
    }
  });
});

describe("callHref", () => {
  it("escapes the step id for the query string", () => {
    expect(callHref("chase:apr_reduction")).toBe("/call?step=chase%3Aapr_reduction");
  });
});

describe("resolveCall", () => {
  it("finds the step, its card and a brief for the agent", () => {
    const plan = resolveCall(testCase(), "chase:apr_reduction", TODAY);
    expect(plan.ok).toBe(true);
    if (!plan.ok) return;
    expect(plan.card.id).toBe("chase");
    expect(plan.step.id).toBe("chase:apr_reduction");
    expect(plan.brief).toMatchObject({ goal: "apr_reduction", holderFirstName: "Maria", currentAprBps: 2724 });
  });

  it("takes the first call without a win when the URL names no step", () => {
    const cards = [testCard({ annualFeeCents: 9500 })];
    const first = resolveCall(testCase({ cards }), null, TODAY);
    expect(first.ok && first.step.id).toBe("chase:apr_reduction");

    const won = testCall({ outcome: testOutcome({ aprAfterBps: 1999 }) });
    const second = resolveCall(testCase({ cards, calls: [won] }), null, TODAY);
    expect(second.ok && second.step.id).toBe("chase:annual_fee_waiver");
  });

  it("points to the dashboard when every call has a win", () => {
    const card = testCard({ creditLimitCents: null });
    const won = testCall({ outcome: testOutcome({ aprAfterBps: 1999 }) });
    const plan = resolveCall(testCase({ cards: [card], calls: [won] }), null, TODAY);
    expect(plan).toMatchObject({ ok: false, title: "No calls left", next: { href: "/dashboard" } });
  });

  it("says so in one sentence when the step is not in the plan", () => {
    for (const step of ["chase:annual_fee_waiver", "nobody:apr_reduction", "garbage"]) {
      expect(resolveCall(testCase(), step, TODAY)).toMatchObject({
        ok: false,
        title: "Step not found",
        next: { href: "/plan" },
      });
    }
  });

  it("does not start a call for a step that needs none", () => {
    expect(resolveCall(testCase(), "chase:balance_transfer", TODAY)).toMatchObject({
      ok: false,
      title: "No call needed",
    });
  });
});
