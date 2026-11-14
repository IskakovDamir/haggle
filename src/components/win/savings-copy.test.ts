import { describe, expect, it } from "vitest";
import { savingsFromOutcome } from "@/lib/engine";
import { testCard, testOutcome } from "@/components/call/test-fixtures";
import { savingsLineLabel } from "./savings-copy";

describe("savingsLineLabel", () => {
  it("leaves English as it is", () => {
    expect(savingsLineLabel("Late fee refunded", "en")).toBe("Late fee refunded");
  });

  it("puts the APR line into Spanish and keeps both rates", () => {
    expect(savingsLineLabel("APR lowered from 29.99% to 27.24%", "es")).toBe("APR reducido de 29.99% a 27.24%");
  });

  it("puts the fixed lines into Spanish", () => {
    expect(savingsLineLabel("Late fee refunded", "es")).toBe("Cargo por pago tardío devuelto");
    expect(savingsLineLabel("Annual fee waived", "es")).toBe("Cuota anual eliminada");
    expect(savingsLineLabel("Statement credit", "es")).toBe("Crédito en el estado de cuenta");
  });

  it("knows every line the engine writes", () => {
    const card = testCard({ purchaseAprBps: 2999, annualFeeCents: 9500, lateFeeCents: 4000 });
    const savings = savingsFromOutcome(
      card,
      testOutcome({ aprAfterBps: 2724, annualFeeWaivedCents: 9500, lateFeeRefundCents: 4000, statementCreditCents: 2500 }),
    );
    expect(savings.lines).toHaveLength(4);
    for (const line of savings.lines) expect(savingsLineLabel(line.label, "es")).not.toBe(line.label);
  });

  it("falls back to the English label it does not know", () => {
    expect(savingsLineLabel("Something new", "es")).toBe("Something new");
  });
});
