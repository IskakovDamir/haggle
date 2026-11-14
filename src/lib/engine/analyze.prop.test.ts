import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { LEVER_ORDER, analyze, annualInterestCents } from "./index";
import { isoDate, someCards } from "./test-arbitraries";

describe("analyze properties", () => {
  it("lists all six levers for every card, each either eligible or with a reason", () => {
    fc.assert(
      fc.property(someCards, isoDate, (cards, today) => {
        const { levers } = analyze(cards, today);
        expect(levers.map((lever) => `${lever.cardId}:${lever.kind}`)).toEqual(
          cards.flatMap((card) => LEVER_ORDER.map((kind) => `${card.id}:${kind}`)),
        );
        for (const lever of levers) {
          expect(lever.ineligibleReason === null).toBe(lever.eligible);
          expect(lever.title.length).toBeGreaterThan(0);
          expect(lever.why.length).toBeGreaterThan(0);
          expect(Number.isInteger(lever.potentialAnnualCents)).toBe(true);
          expect(lever.potentialAnnualCents).toBeGreaterThanOrEqual(0);
          if (!lever.eligible) expect(lever.potentialAnnualCents).toBe(0);
          // A success rate never appears without its source.
          expect(lever.successRatePct === null).toBe(lever.source === null);
        }
      }),
    );
  });

  it("no lever promises more than the interest and fees the card actually charges", () => {
    fc.assert(
      fc.property(someCards, isoDate, (cards, today) => {
        const { levers } = analyze(cards, today);
        for (const card of cards) {
          const interest = annualInterestCents(card.balanceCents, card.purchaseAprBps);
          const most = Math.max(interest, card.annualFeeCents, card.lateFeeCents);
          for (const lever of levers.filter((each) => each.cardId === card.id)) {
            expect(lever.potentialAnnualCents).toBeLessThanOrEqual(most);
          }
        }
      }),
    );
  });

  it("the plan is the eligible levers, numbered from 1, in SPEC order, never due in the past", () => {
    fc.assert(
      fc.property(someCards, isoDate, (cards, today) => {
        const { levers, plan } = analyze(cards, today);
        const eligible = levers.filter((lever) => lever.eligible);
        expect(plan.map((step) => step.id).sort()).toEqual(eligible.map((lever) => `${lever.cardId}:${lever.kind}`).sort());
        expect(plan.map((step) => step.order)).toEqual(plan.map((_, index) => index + 1));

        const ranks = plan.map((step) => LEVER_ORDER.indexOf(step.lever.kind));
        expect(ranks).toEqual([...ranks].sort((a, b) => a - b));

        for (const step of plan) {
          const waits = step.lever.kind === "credit_limit_increase" || step.lever.kind === "balance_transfer";
          expect(step.dueOn === null).toBe(!waits);
          // ISO dates sort as text.
          if (step.dueOn !== null) expect(step.dueOn >= today).toBe(true);
        }
      }),
    );
  });

  it("the totals add up, and the potential is what the calls could win", () => {
    fc.assert(
      fc.property(someCards, isoDate, (cards, today) => {
        const analysis = analyze(cards, today);
        const sum = (amounts: number[]) => amounts.reduce((total, amount) => total + amount, 0);
        expect(analysis.totals.balanceCents).toBe(sum(cards.map((card) => card.balanceCents)));
        expect(analysis.totals.annualInterestCents).toBe(sum(analysis.cards.map((card) => card.annualInterestCents)));
        expect(analysis.totals.potentialAnnualCents).toBe(
          sum(analysis.plan.filter((step) => step.lever.needsCall).map((step) => step.lever.potentialAnnualCents)),
        );
        expect(analysis.cards.map((card) => card.cardId)).toEqual(cards.map((card) => card.id));
      }),
    );
  });

  it("gives the same answer for the same input", () => {
    fc.assert(
      fc.property(someCards, isoDate, (cards, today) => {
        expect(analyze(cards, today)).toEqual(analyze(cards, today));
      }),
    );
  });
});
