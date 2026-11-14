import { describe, expect, it } from "vitest";
import type { CallOutcome } from "@/lib/types";
import { buildBrief } from "./brief";
import { gradeAprResult } from "./grade";
import { draft, lever, mariaCapitalOne, mariaChase } from "./test-support";

// Maria's Chase card: 27.24% now, ask 17.24%, anything at 25.24% or lower is a win.
const brief = buildBrief({ card: mariaChase, holderFirstName: "Maria", lever: lever("apr_reduction", "chase") });
const verified = (overrides: Partial<CallOutcome>): CallOutcome => ({ ...draft(overrides), verified: true });

describe("gradeAprResult", () => {
  it("calls a rate at or under the accept threshold a win", () => {
    expect(gradeAprResult(verified({ result: "partial", aprAfterBps: 2524 }), brief).result).toBe("won");
    expect(gradeAprResult(verified({ result: "partial", aprAfterBps: 1999 }), brief).result).toBe("won");
  });

  it("calls a smaller cut partial", () => {
    expect(gradeAprResult(verified({ result: "won", aprAfterBps: 2525 }), brief).result).toBe("partial");
    expect(gradeAprResult(verified({ result: "won", aprAfterBps: 2700 }), brief).result).toBe("partial");
  });

  it("calls a claimed win with no lower rate unclear", () => {
    for (const aprAfterBps of [null, 2724, 2999]) {
      expect(gradeAprResult(verified({ result: "won", aprAfterBps }), brief)).toMatchObject({
        result: "unclear",
        aprAfterBps: null,
        verified: false,
      });
    }
  });

  it("calls it partial when the rate stayed but the bank gave something else", () => {
    const outcome = gradeAprResult(verified({ result: "won", aprAfterBps: 2724, statementCreditCents: 5000 }), brief);
    expect(outcome).toMatchObject({ result: "partial", aprAfterBps: null, statementCreditCents: 5000, verified: true });
  });

  it("leaves declined and unclear calls alone", () => {
    const declined = verified({ result: "declined" });
    const unclear: CallOutcome = { ...draft({ result: "unclear", aprAfterBps: 1999 }), verified: false };
    expect(gradeAprResult(declined, brief)).toBe(declined);
    expect(gradeAprResult(unclear, brief)).toBe(unclear);
  });

  it("leaves calls about anything but the rate alone", () => {
    const feeBrief = buildBrief({ card: mariaCapitalOne, holderFirstName: "Maria", lever: lever("annual_fee_waiver") });
    const won = verified({ result: "won", annualFeeWaivedCents: 9500 });
    expect(gradeAprResult(won, feeBrief)).toBe(won);
  });
});
