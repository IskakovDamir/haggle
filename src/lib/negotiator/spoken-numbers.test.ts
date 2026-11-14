import { describe, expect, it } from "vitest";
import { verifyOutcome } from "./verify";
import { spokenFigures } from "./spoken-numbers";

describe("spokenFigures", () => {
  it.each([
    ["I can refund the forty dollar late fee", [4000]],
    ["forty-five dollars", [4500]],
    ["twenty seven point two four percent", [2724]],
    ["twenty nine point nine nine", [2999]],
    ["two hundred nine dollars and ninety three cents", [20900, 20993]],
    ["two hundred and nine dollars", [20900]],
    ["one thousand two hundred fifty", [125000]],
    ["ninety five dollar annual fee", [9500]],
    ["nineteen point nine nine", [1999]],
    ["le reembolso los cuarenta dólares", [4000]],
    ["cuarenta y cinco dólares", [4500]],
    ["veintisiete punto veinticuatro por ciento", [2724]],
    ["veintinueve punto noventa y nueve", [2999]],
    ["doscientos nueve dólares con noventa y tres centavos", [20900, 20993]],
    ["mil doscientos cincuenta", [125000]],
    ["veintiún dólares", [2100]],
  ])("reads %s", (text, figures) => {
    for (const figure of figures) expect(spokenFigures(text)).toContain(figure);
  });

  it("finds nothing in a line without numbers", () => {
    expect(spokenFigures("Sure, I can help with that today.")).toEqual([]);
  });

  it("keeps separate numbers apart", () => {
    expect(spokenFigures("from twenty nine point nine nine to twenty seven point two four")).toEqual([2999, 2724]);
  });
});

describe("verifyOutcome with spoken numbers", () => {
  it("accepts a fee the bank said in words", () => {
    const turns = [
      { role: "agent" as const, text: "Could you refund the late fee?", at: 0 },
      { role: "bank" as const, text: "I can refund the forty dollar late fee as a one-time courtesy, yeah.", at: 1000 },
    ];
    const outcome = verifyOutcome(
      {
        result: "won",
        aprAfterBps: null,
        annualFeeWaivedCents: null,
        lateFeeRefundCents: 4000,
        creditLimitAfterCents: null,
        statementCreditCents: null,
        followUp: null,
        evidence: [],
      },
      turns,
    );
    expect(outcome).toMatchObject({ result: "won", lateFeeRefundCents: 4000, verified: true });
  });
});
