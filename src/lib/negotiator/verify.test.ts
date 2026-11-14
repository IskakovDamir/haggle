import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { draft, transcript } from "./test-support";
import { verifyOutcome } from "./verify";

const OPENING = "Hello. This is Haggle, an AI assistant. We are calling to ask for a lower interest rate, from 27.24% to 17.24%.";

describe("verifyOutcome: a true outcome passes", () => {
  it("keeps an APR the bank said itself", () => {
    const turns = transcript(
      ["agent", OPENING],
      ["bank", "I can't do 17.24, but I can lower your APR to 19.99% starting with your next statement."],
      ["agent", "Thank you. To confirm, the new purchase APR is 19.99% from the next statement. Is that right?"],
      ["bank", "Yes, that's right."],
    );
    const outcome = verifyOutcome(
      draft({ result: "won", aprAfterBps: 1999, evidence: [{ quote: "I can lower your APR to 19.99%", turnIndex: 1 }] }),
      turns,
    );
    expect(outcome).toMatchObject({ result: "won", aprAfterBps: 1999, verified: true });
    expect(outcome.evidence).toEqual([{ quote: "I can lower your APR to 19.99%", turnIndex: 1 }]);
  });

  it("keeps a declined call as it is", () => {
    const turns = transcript(["agent", OPENING], ["bank", "I'm sorry, there is nothing I can do on the rate today."]);
    expect(verifyOutcome(draft({ result: "declined", followUp: "Ask again in six months." }), turns)).toEqual({
      ...draft({ result: "declined", followUp: "Ask again in six months." }),
      verified: true,
    });
  });

  it("drops numbers from a declined call: a call that was declined granted nothing", () => {
    const turns = transcript(["agent", OPENING], ["bank", "No. We might look at 19.99% next year."]);
    expect(verifyOutcome(draft({ result: "declined", aprAfterBps: 1999 }), turns)).toMatchObject({
      result: "declined",
      aprAfterBps: null,
      verified: true,
    });
  });

  it("keeps a win the bank stated without a number, when its words are quoted", () => {
    const turns = transcript(["agent", "We would like a higher credit limit."], ["bank", "Done, I have approved the increase."]);
    const outcome = verifyOutcome(draft({ result: "won", evidence: [{ quote: "I have approved the increase", turnIndex: 1 }] }), turns);
    expect(outcome).toMatchObject({ result: "won", verified: true });
  });
});

describe("verifyOutcome: what it catches", () => {
  it("catches an invented APR", () => {
    const turns = transcript(["agent", OPENING], ["bank", "The best I can do is 21.99%."]);
    const outcome = verifyOutcome(draft({ result: "won", aprAfterBps: 1999 }), turns);
    expect(outcome).toMatchObject({ result: "unclear", aprAfterBps: null, verified: false });
  });

  it("catches an APR that only the agent said", () => {
    const turns = transcript(
      ["agent", OPENING],
      ["bank", "Let me see what I can do."],
      ["agent", "So the new rate is 19.99%, correct?"],
      ["bank", "Yes."],
    );
    const outcome = verifyOutcome(
      draft({ result: "won", aprAfterBps: 1999, evidence: [{ quote: "So the new rate is 19.99%, correct?", turnIndex: 2 }] }),
      turns,
    );
    expect(outcome).toMatchObject({ result: "unclear", aprAfterBps: null, verified: false });
    expect(outcome.evidence).toEqual([]);
  });

  it("catches the agent's own ask reported as the result", () => {
    const turns = transcript(["agent", OPENING], ["bank", "No, we are not able to change the rate."]);
    expect(verifyOutcome(draft({ result: "won", aprAfterBps: 1724 }), turns)).toMatchObject({
      result: "unclear",
      aprAfterBps: null,
      verified: false,
    });
  });

  it("catches a fee waiver the bank never granted, and keeps what it did grant", () => {
    const turns = transcript(
      ["agent", "We are calling to ask you to waive the $95 annual fee."],
      ["bank", "I can't waive the fee. What I can do is lower your rate to 24.99%."],
    );
    const outcome = verifyOutcome(draft({ result: "won", aprAfterBps: 2499, annualFeeWaivedCents: 9500 }), turns);
    expect(outcome).toMatchObject({ result: "unclear", aprAfterBps: 2499, annualFeeWaivedCents: null, verified: false });
  });

  it("catches a win with no number and no words from the bank behind it", () => {
    const turns = transcript(["agent", OPENING], ["bank", "Please hold."]);
    expect(verifyOutcome(draft({ result: "won" }), turns)).toMatchObject({ result: "unclear", verified: false });
    expect(verifyOutcome(draft({ result: "partial", evidence: [{ quote: "we lowered it", turnIndex: 1 }] }), turns)).toMatchObject({
      result: "unclear",
      verified: false,
    });
  });

  it("does not accept digits that are part of a different number", () => {
    const turns = transcript(["bank", "Your balance is $1,219.99 and your reference number is 199945."]);
    expect(verifyOutcome(draft({ result: "won", aprAfterBps: 1999 }), turns).verified).toBe(false);
  });

  it("never verifies a granted number on a call where the bank said nothing", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 4000 }), fc.array(fc.string(), { maxLength: 6 }), (aprAfterBps, agentLines) => {
        const turns = transcript(...agentLines.map((text): ["agent", string] => ["agent", `${text} ${aprAfterBps / 100}%`]));
        const outcome = verifyOutcome(draft({ result: "won", aprAfterBps }), turns);
        expect(outcome).toMatchObject({ result: "unclear", aprAfterBps: null, verified: false });
      }),
    );
  });
});

describe("verifyOutcome: how numbers are matched", () => {
  const feeWaived = (bankLine: string) =>
    verifyOutcome(draft({ result: "won", annualFeeWaivedCents: 9500 }), transcript(["bank", bankLine]));
  const newLimit = (bankLine: string) =>
    verifyOutcome(draft({ result: "won", creditLimitAfterCents: 1_250_000 }), transcript(["bank", bankLine]));

  it("matches dollars with or without cents", () => {
    expect(feeWaived("I have waived the $95 fee.").verified).toBe(true);
    expect(feeWaived("I have waived the $95.00 fee.").verified).toBe(true);
    expect(feeWaived("I have waived the 95 dollar fee.").verified).toBe(true);
  });

  it("matches dollars with or without thousands separators", () => {
    expect(newLimit("Your new limit is $12,500.").verified).toBe(true);
    expect(newLimit("Your new limit is $12,500.00.").verified).toBe(true);
    expect(newLimit("Your new limit is 12500 dollars.").verified).toBe(true);
  });

  it("does not match a different amount", () => {
    expect(feeWaived("I can give you a $9.50 credit.").verified).toBe(false);
    expect(feeWaived("I can give you a $950 credit.").verified).toBe(false);
    expect(newLimit("Your new limit is $1,250.").verified).toBe(false);
  });

  it("matches a rate with or without trailing zeros", () => {
    const rate = (bps: number, bankLine: string) =>
      verifyOutcome(draft({ result: "won", aprAfterBps: bps }), transcript(["bank", bankLine])).verified;
    expect(rate(1999, "We can do 19.99 percent.")).toBe(true);
    expect(rate(2000, "We can do 20%.")).toBe(true);
    expect(rate(1990, "We can do 19.9%.")).toBe(true);
    expect(rate(0, "We can do 0% for twelve months.")).toBe(true);
    expect(rate(1999, "We can do 19.9%.")).toBe(false);
  });

  it("drops a waiver or credit of zero without calling the outcome unclear", () => {
    const turns = transcript(["bank", "I can lower your APR to 19.99%."]);
    const outcome = verifyOutcome(draft({ result: "won", aprAfterBps: 1999, statementCreditCents: 0 }), turns);
    expect(outcome).toMatchObject({ result: "won", statementCreditCents: null, verified: true });
  });
});

describe("verifyOutcome: evidence", () => {
  const turns = transcript(
    ["agent", "Could you lower the rate to 17.24%?"],
    ["bank", "I can   offer 19.99% on purchases."],
    ["agent", "Thank you."],
  );

  it("drops quotes the bank did not say", () => {
    const outcome = verifyOutcome(
      draft({
        result: "won",
        aprAfterBps: 1999,
        evidence: [
          { quote: "Could you lower the rate to 17.24%?", turnIndex: 0 },
          { quote: "We have approved 17.24%", turnIndex: 1 },
          { quote: "", turnIndex: 1 },
        ],
      }),
      turns,
    );
    expect(outcome.evidence).toEqual([]);
    expect(outcome.verified).toBe(true);
  });

  it("points a real quote at the turn it is in, ignoring case and spacing", () => {
    const outcome = verifyOutcome(
      draft({ result: "won", aprAfterBps: 1999, evidence: [{ quote: "i can offer 19.99% on purchases", turnIndex: 7 }] }),
      turns,
    );
    expect(outcome.evidence).toEqual([{ quote: "i can offer 19.99% on purchases", turnIndex: 1 }]);
  });
});
