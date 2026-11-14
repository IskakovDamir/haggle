import { describe, expect, it } from "vitest";
import { testOutcome } from "@/components/call/test-fixtures";
import { outcomeKind } from "./outcome-kind";

describe("outcomeKind", () => {
  it("counts a confirmed win or partial win as a win", () => {
    expect(outcomeKind(testOutcome({ result: "won" }))).toBe("win");
    expect(outcomeKind(testOutcome({ result: "partial" }))).toBe("win");
  });

  it("never counts an unconfirmed result as a win, whatever it claims", () => {
    for (const result of ["won", "partial", "declined", "unclear"] as const) {
      expect(outcomeKind(testOutcome({ result, verified: false }))).toBe("unconfirmed");
    }
  });

  it("tells a no from no answer", () => {
    expect(outcomeKind(testOutcome({ result: "declined" }))).toBe("declined");
    expect(outcomeKind(testOutcome({ result: "unclear" }))).toBe("unclear");
  });
});
