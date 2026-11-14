import { describe, expect, it } from "vitest";
import { MISSED_REASONS } from "@/lib/missed";
import { localizeMissedError, reasonLabelFor } from "./missed-copy";
import { BLANK_MISSED, readMissedForm } from "./missed-model";

describe("reasonLabelFor", () => {
  it("keeps the English labels from src/lib/missed.ts", () => {
    for (const reason of MISSED_REASONS) expect(reasonLabelFor(reason.id, "en")).toBe(reason.label);
  });

  it("has a Spanish label for every reason", () => {
    const spanish = MISSED_REASONS.map((reason) => reasonLabelFor(reason.id, "es"));
    expect(spanish).not.toContain(undefined);
    expect(new Set(spanish).size).toBe(MISSED_REASONS.length);
    expect(reasonLabelFor("account_changed", "es")).toBe("Cambié de cuenta bancaria");
  });
});

describe("localizeMissedError", () => {
  it("leaves English as it is", () => {
    expect(localizeMissedError("Type the bank's name.", "en")).toBe("Type the bank's name.");
  });

  it("puts every error of an empty form into Spanish", () => {
    const result = readMissedForm(BLANK_MISSED, { id: "draft", thisYear: 2026 });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    for (const message of Object.values(result.errors)) {
      expect(localizeMissedError(message, "es")).not.toBe(message);
    }
  });

  it("puts the typed-value errors into Spanish", () => {
    const result = readMissedForm(
      { ...BLANK_MISSED, issuerName: "Chase", balance: "-5", apr: "abc", last4: "12345", memberSinceYear: "1900", daysLate: "999" },
      { id: "draft", thisYear: 2026 },
    );
    if (result.ok) throw new Error("expected errors");
    for (const message of Object.values(result.errors)) {
      expect(localizeMissedError(message, "es")).not.toBe(message);
    }
  });

  it("keeps the numbers in a sentence", () => {
    expect(localizeMissedError("Type a year between 1950 and 2026.", "es")).toBe("Escribe un año entre 1950 y 2026.");
    expect(localizeMissedError("Keep it under 150 characters.", "es")).toBe("Usa menos de 150 caracteres.");
    expect(localizeMissedError("Type a whole number from 0 to 180.", "es")).toBe("Escribe un número entero del 0 al 180.");
  });

  it("falls back to the English sentence it does not know", () => {
    expect(localizeMissedError("Something new went wrong.", "es")).toBe("Something new went wrong.");
  });
});
