import { describe, expect, it } from "vitest";
import { testCard, testOutcome } from "@/components/call/test-fixtures";
import { changesFromOutcome } from "./changes";

describe("changesFromOutcome", () => {
  it("shows a lowered APR as before and after", () => {
    expect(changesFromOutcome(testCard(), testOutcome({ aprAfterBps: 1999 }))).toEqual([
      { label: "APR", before: "27.24%", after: "19.99%" },
    ]);
  });

  it("ignores an APR that did not go down", () => {
    expect(changesFromOutcome(testCard(), testOutcome({ aprAfterBps: 2724 }))).toEqual([]);
    expect(changesFromOutcome(testCard(), testOutcome({ aprAfterBps: 2999 }))).toEqual([]);
  });

  it("shows a waived annual fee against the fee on the statement", () => {
    const card = testCard({ annualFeeCents: 9500 });
    expect(changesFromOutcome(card, testOutcome({ annualFeeWaivedCents: 9500 }))).toEqual([
      { label: "Annual fee", before: "$95", after: "$0" },
    ]);
    expect(changesFromOutcome(card, testOutcome({ annualFeeWaivedCents: 5000 }))).toEqual([
      { label: "Annual fee", before: "$95", after: "$45" },
    ]);
  });

  it("lists everything a call won, the rate first", () => {
    const card = testCard({ creditLimitCents: 400_000 });
    const outcome = testOutcome({
      statementCreditCents: 5000,
      creditLimitAfterCents: 500_000,
      lateFeeRefundCents: 4000,
      aprAfterBps: 2199,
    });
    expect(changesFromOutcome(card, outcome).map((change) => change.label)).toEqual([
      "APR",
      "Late fee refunded",
      "Credit limit",
      "Statement credit",
    ]);
  });

  it("has no before value for a limit the statement did not show", () => {
    const card = testCard({ creditLimitCents: null });
    expect(changesFromOutcome(card, testOutcome({ creditLimitAfterCents: 500_000 }))).toEqual([
      { label: "Credit limit", before: null, after: "$5,000" },
    ]);
  });

  it("shows nothing for zero or missing grants", () => {
    const outcome = testOutcome({ annualFeeWaivedCents: 0, lateFeeRefundCents: 0, statementCreditCents: 0 });
    expect(changesFromOutcome(testCard(), outcome)).toEqual([]);
  });
});
