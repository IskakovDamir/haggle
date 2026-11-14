import { describe, expect, it } from "vitest";
import { formatClock } from "./clock";

describe("formatClock", () => {
  it("shows minutes and two-digit seconds", () => {
    expect(formatClock(0)).toBe("0:00");
    expect(formatClock(9_999)).toBe("0:09");
    expect(formatClock(402_000)).toBe("6:42");
    expect(formatClock(3_600_000)).toBe("60:00");
  });

  it("never goes below zero", () => {
    expect(formatClock(-5_000)).toBe("0:00");
  });
});
