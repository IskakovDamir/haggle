import { describe, expect, it } from "vitest";
import { testCall, testCard, testCase, testOutcome } from "@/components/call/test-fixtures";
import type { MissedPayment } from "@/lib/types";
import { alertsFor, headlineAlert } from "./alerts-model";

const TODAY = "2026-11-14";

const missed: MissedPayment = {
  reason: "autopay_failed",
  note: "",
  daysLate: 12,
  paidSince: true,
  firstInYear: true,
  aprBeforeBps: null,
};

const winWithFee = testCall({
  outcome: testOutcome({ aprAfterBps: 1999 }),
  savings: { annualSavingsCents: 60_900, lines: [], feeCents: 12_180 },
});

describe("alertsFor", () => {
  it("lists the plan's dated steps, soonest first", () => {
    const alerts = alertsFor(testCase(), TODAY);
    expect(alerts.map((alert) => [alert.kind, alert.id, alert.date, alert.when])).toEqual([
      ["plan_step", "chase:credit_limit_increase", "2026-12-14", "soon"],
      ["plan_step", "chase:balance_transfer", "2027-01-13", "later"],
    ]);
    // A limit increase needs a call, but not before its date.
    expect(alerts[0].action).toEqual({ href: "/plan", label: "See your plan" });
    expect(alerts[1].action.label).toBe("See how");
  });

  it("marks a step due today when its date comes", () => {
    // The promo ends in 17 days, so the plan moves the balance transfer up to today.
    const card = testCard({ promo: { aprBps: 0, endsOn: "2026-12-01" } });
    const transfer = alertsFor(testCase({ cards: [card] }), TODAY).find((alert) => alert.id === "chase:balance_transfer");
    expect(transfer?.date).toBe(TODAY);
    expect(transfer?.when).toBe("now");
    expect(transfer?.short).toBe("Balance transfer is due");
  });

  it("warns before a promo rate ends", () => {
    const card = testCard({ promo: { aprBps: 0, endsOn: "2026-12-25" } });
    const promo = alertsFor(testCase({ cards: [card] }), TODAY).find((alert) => alert.kind === "promo_ending");
    expect(promo?.title).toBe("Chase promo ends in 41 days");
    expect(promo?.detail).toBe("The 0.00% promo rate ends on Dec 25, 2026. After that the rate is 27.24%.");
    expect(promo?.date).toBe("2026-12-25");
  });

  it("drops a promo that has already ended", () => {
    const card = testCard({ promo: { aprBps: 0, endsOn: "2026-10-01" } });
    expect(alertsFor(testCase({ cards: [card] }), TODAY).some((alert) => alert.kind === "promo_ending")).toBe(false);
  });

  it("dates a declined ask six months out, with the bank's own follow-up", () => {
    const declined = testCall({ outcome: testOutcome({ result: "declined", followUp: "Ask again after six on-time payments." }) });
    const again = alertsFor(testCase({ calls: [declined] }), TODAY).find((alert) => alert.kind === "ask_again");
    expect(again?.date).toBe("2027-05-14");
    expect(again?.detail).toBe("Chase said no on Nov 14, 2026. Ask again after six on-time payments.");
    expect(again?.action.href).toBe("/calls");
  });

  it("keeps the bank's follow-up on a win and the fee still to pay", () => {
    const won = { ...winWithFee, outcome: testOutcome({ aprAfterBps: 1999, followUp: "Set up autopay this month." }) };
    const alerts = alertsFor(testCase({ calls: [won] }), TODAY);
    const fee = alerts.find((alert) => alert.kind === "fee_due");
    expect(fee?.title).toBe("Pay after your win: $121.80");
    expect(fee?.when).toBe("now");
    expect(fee?.action).toEqual({ href: "/win?call=call-1", label: "Pay after your win" });
    const followUp = alerts.find((alert) => alert.kind === "follow_up");
    expect(followUp?.title).toBe("Set up autopay this month.");
    expect(followUp?.date).toBe("2026-12-14");
  });

  it("has nothing to collect once the fee is paid", () => {
    const paid = { ...winWithFee, paid: { amountCents: 12_180, sessionId: "cs_test", at: "2026-11-14T13:00:00.000Z" } };
    expect(alertsFor(testCase({ calls: [paid] }), TODAY).some((alert) => alert.kind === "fee_due")).toBe(false);
  });

  it("flags a missed payment nobody has called about", () => {
    const card = testCard({ missedPayment: missed, lateFeeCents: 4_000 });
    const alert = alertsFor(testCase({ cards: [card] }), TODAY).find((candidate) => candidate.kind === "missed_no_call");
    expect(alert?.title).toBe("Missed payment on Chase: no call yet");
    expect(alert?.when).toBe("now");
    expect(alert?.detail).toContain("The $40 late fee can be part of the ask.");
    expect(alert?.detail).toContain("It is 12 days late.");
    expect(alert?.action.href).toBe("/call?step=chase%3Amissed_payment");
  });

  it("stops flagging the missed payment after the call", () => {
    const card = testCard({ missedPayment: missed, lateFeeCents: 4_000 });
    const call = testCall({ goal: "missed_payment", outcome: testOutcome({ result: "declined" }) });
    const alerts = alertsFor(testCase({ cards: [card], calls: [call] }), TODAY);
    expect(alerts.some((alert) => alert.kind === "missed_no_call")).toBe(false);
  });
});

describe("headlineAlert", () => {
  it("puts a promo ending soon first", () => {
    const card = testCard({ promo: { aprBps: 0, endsOn: "2026-12-25" } });
    const alerts = alertsFor(testCase({ cards: [card], calls: [winWithFee] }), TODAY);
    expect(headlineAlert(alerts, TODAY)?.kind).toBe("promo_ending");
  });

  it("leaves a promo that ends far away to the alerts page", () => {
    const card = testCard({ promo: { aprBps: 0, endsOn: "2027-09-01" } });
    const alerts = alertsFor(testCase({ cards: [card], calls: [winWithFee] }), TODAY);
    expect(headlineAlert(alerts, TODAY)?.kind).toBe("fee_due");
  });

  it("falls back to what is due now, then to the soonest", () => {
    expect(headlineAlert(alertsFor(testCase({ calls: [winWithFee] }), TODAY), TODAY)?.kind).toBe("fee_due");
    expect(headlineAlert(alertsFor(testCase(), TODAY), TODAY)?.id).toBe("chase:credit_limit_increase");
    expect(headlineAlert([], TODAY)).toBeNull();
  });
});
