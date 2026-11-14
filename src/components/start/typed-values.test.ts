import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  MAX_DOLLARS,
  dollarsForEditing,
  percentForEditing,
  typedCount,
  typedDate,
  typedDollars,
  typedLast4,
  typedPercent,
  typedText,
  typedYear,
  type Typed,
} from "./typed-values";

const valueOf = <T>(result: Typed<T>) => (result.kind === "value" ? result.value : result.kind);

describe("typedDollars", () => {
  it.each([
    ["8400", 840_000],
    ["8,400", 840_000],
    ["$8,400.00", 840_000],
    [" $ 8 400.5 ", 840_050],
    ["8400.", 840_000],
    [".50", 50],
    ["0", 0],
    ["95", 9_500],
    ["1,234,567.89", 123_456_789],
    ["0.07", 7],
  ])("reads %j as %i cents", (text, cents) => {
    expect(valueOf(typedDollars(text))).toBe(cents);
  });

  it("reads a decimal comma, which cannot be mistaken for a thousands comma", () => {
    expect(valueOf(typedDollars("8400,50"))).toBe(840_050);
    expect(valueOf(typedDollars("8,5"))).toBe(850);
    expect(valueOf(typedDollars("8,400"))).toBe(840_000);
  });

  it("keeps cents exact where floating point would not", () => {
    // 1.15 * 100 is 114.99999999999999 in floating point.
    expect(valueOf(typedDollars("1.15"))).toBe(115);
    expect(valueOf(typedDollars("8400.29"))).toBe(840_029);
  });

  it("treats blank input as empty, not as zero", () => {
    expect(typedDollars("").kind).toBe("empty");
    expect(typedDollars("  ").kind).toBe("empty");
    expect(typedDollars("$").kind).toBe("empty");
  });

  it.each(["abc", "8.4.0", "8,40,0", "1,234,56", "12.345", "-5", "(5.00)", "8400 USD", "1e3", "."])(
    "refuses %j with a sentence",
    (text) => {
      const result = typedDollars(text);
      expect(result.kind).toBe("invalid");
      expect(result.kind === "invalid" && result.message).toMatch(/\.$/);
    },
  );

  it("refuses amounts no card statement shows", () => {
    expect(valueOf(typedDollars(String(MAX_DOLLARS)))).toBe(MAX_DOLLARS * 100);
    expect(typedDollars(String(MAX_DOLLARS + 1)).kind).toBe("invalid");
    expect(typedDollars("9".repeat(400)).kind).toBe("invalid");
  });

  it("reads back what it writes for editing", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: MAX_DOLLARS * 100 }), (cents) => {
        expect(valueOf(typedDollars(dollarsForEditing(cents)))).toBe(cents);
      }),
    );
  });

  it("always returns whole, non-negative cents", () => {
    fc.assert(
      fc.property(fc.string(), (text) => {
        const result = typedDollars(text);
        if (result.kind === "value") {
          expect(Number.isInteger(result.value)).toBe(true);
          expect(result.value).toBeGreaterThanOrEqual(0);
        }
      }),
    );
  });
});

describe("typedPercent", () => {
  it.each([
    ["27.24", 2724],
    ["27.24%", 2724],
    [" 27,24 % ", 2724],
    ["29.9", 2990],
    ["0", 0],
    ["0%", 0],
    ["24", 2400],
    ["24.", 2400],
    ["100", 10_000],
    ["9.99", 999],
  ])("reads %j as %i basis points", (text, bps) => {
    expect(valueOf(typedPercent(text))).toBe(bps);
  });

  it("keeps basis points exact where floating point would not", () => {
    // 0.29 * 100 is 28.999999999999996 in floating point.
    expect(valueOf(typedPercent("0.29"))).toBe(29);
    expect(valueOf(typedPercent("19.99"))).toBe(1999);
  });

  it("treats blank input as empty", () => {
    expect(typedPercent("").kind).toBe("empty");
    expect(typedPercent(" % ").kind).toBe("empty");
  });

  it.each(["abc", "27.245", "-3", "100.01", "272.4", "1,000", "27 percent", "%%"])("refuses %j", (text) => {
    expect(typedPercent(text).kind).toBe("invalid");
  });

  it("reads back what it writes for editing", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 10_000 }), (bps) => {
        expect(valueOf(typedPercent(percentForEditing(bps)))).toBe(bps);
      }),
    );
  });
});

describe("text written for editing", () => {
  it("shows amounts with thousands commas and two decimals", () => {
    expect(dollarsForEditing(840_000)).toBe("8,400.00");
    expect(dollarsForEditing(9_505)).toBe("95.05");
    expect(dollarsForEditing(0)).toBe("0.00");
  });

  it("shows rates with two decimals", () => {
    expect(percentForEditing(2724)).toBe("27.24");
    expect(percentForEditing(2400)).toBe("24.00");
    expect(percentForEditing(5)).toBe("0.05");
  });

  it("leaves an unknown value blank", () => {
    expect(dollarsForEditing(null)).toBe("");
    expect(percentForEditing(null)).toBe("");
  });
});

describe("typedDate", () => {
  it("accepts a real calendar day", () => {
    expect(valueOf(typedDate("2026-12-25"))).toBe("2026-12-25");
    expect(valueOf(typedDate(" 2028-02-29 "))).toBe("2028-02-29");
  });

  it("refuses days that do not exist and other formats", () => {
    expect(typedDate("2026-02-30").kind).toBe("invalid");
    expect(typedDate("2026-13-01").kind).toBe("invalid");
    expect(typedDate("12/25/2026").kind).toBe("invalid");
    expect(typedDate("").kind).toBe("empty");
  });
});

describe("typedCount and typedYear", () => {
  it("reads whole numbers inside the range", () => {
    expect(valueOf(typedCount("0", 12))).toBe(0);
    expect(valueOf(typedCount(" 12 ", 12))).toBe(12);
    expect(typedCount("13", 12).kind).toBe("invalid");
    expect(typedCount("1.5", 12).kind).toBe("invalid");
    expect(typedCount("", 12).kind).toBe("empty");
  });

  it("reads a member-since year that is not in the future", () => {
    expect(valueOf(typedYear("2020", 2026))).toBe(2020);
    expect(valueOf(typedYear("2026", 2026))).toBe(2026);
    expect(typedYear("2027", 2026).kind).toBe("invalid");
    expect(typedYear("1949", 2026).kind).toBe("invalid");
    expect(typedYear("20", 2026).kind).toBe("invalid");
    expect(typedYear("", 2026).kind).toBe("empty");
  });
});

describe("typedLast4 and typedText", () => {
  it("keeps exactly four digits", () => {
    expect(valueOf(typedLast4("4417"))).toBe("4417");
    expect(valueOf(typedLast4(" 44 17 "))).toBe("4417");
    expect(typedLast4("441").kind).toBe("invalid");
    expect(typedLast4("44a7").kind).toBe("invalid");
    expect(typedLast4("").kind).toBe("empty");
  });

  it("refuses a full card number, so it is never stored", () => {
    const full = typedLast4("4111 1111 1111 4417");
    expect(full).toEqual({ kind: "invalid", message: "Only the last four digits. We never keep the full card number." });
    expect(typedText("Chase 4111-1111-1111-4417").kind).toBe("invalid");
  });

  it("trims text and collapses spaces", () => {
    expect(valueOf(typedText("  Capital   One "))).toBe("Capital One");
    expect(typedText("   ").kind).toBe("empty");
    expect(typedText("x".repeat(61)).kind).toBe("invalid");
  });
});
