import { describe, expect, it } from "vitest";
import { testCall, testOutcome, testStep } from "@/components/call/test-fixtures";
import { askAgainDate, calendarEventsFor, firstOpenStep, isWin, nextSteps, stepIdOf } from "./progress";

const TODAY = "2026-11-14";
const aprStep = testStep();
const feeStep = testStep({ kind: "annual_fee_waiver", title: "Ask Chase to waive the annual fee" });
const limitStep = testStep({ kind: "credit_limit_increase", title: "Ask Chase for a higher limit" }, "2026-12-14");
const transferStep = testStep({ kind: "balance_transfer", title: "Move the balance", needsCall: false }, "2027-01-13");
const plan = [aprStep, feeStep, limitStep, transferStep];

const win = testCall({ outcome: testOutcome({ aprAfterBps: 1999 }) });
const declined = testCall({ id: "call-2", outcome: testOutcome({ result: "declined" }) });

describe("isWin", () => {
  it("needs a confirmed yes", () => {
    expect(isWin(win)).toBe(true);
    expect(isWin(declined)).toBe(false);
    expect(isWin(testCall())).toBe(false);
    expect(isWin(testCall({ outcome: testOutcome({ verified: false }) }))).toBe(false);
  });
});

describe("stepIdOf", () => {
  it("matches the plan's step ids", () => {
    expect(stepIdOf(win)).toBe(aprStep.id);
  });
});

describe("firstOpenStep", () => {
  it("skips steps that already have a win", () => {
    expect(firstOpenStep(plan, [])?.id).toBe("chase:apr_reduction");
    expect(firstOpenStep(plan, [win])?.id).toBe("chase:annual_fee_waiver");
  });

  it("does not skip a step that was only declined", () => {
    expect(firstOpenStep(plan, [declined])?.id).toBe("chase:apr_reduction");
  });

  it("can leave one step out and look only at calls", () => {
    expect(firstOpenStep(plan, [], { except: "chase:apr_reduction" })?.id).toBe("chase:annual_fee_waiver");
    expect(firstOpenStep([transferStep], [], { needsCall: true })).toBeNull();
  });
});

describe("askAgainDate", () => {
  it("is six months after the call", () => {
    expect(askAgainDate(declined)).toBe("2027-05-14");
  });
});

describe("nextSteps", () => {
  it("lists every open step with a date, soonest first, calls due today", () => {
    const steps = nextSteps(plan, [], TODAY);
    expect(steps.map((step) => [step.id, step.dueOn])).toEqual([
      ["chase:apr_reduction", TODAY],
      ["chase:annual_fee_waiver", TODAY],
      ["chase:credit_limit_increase", "2026-12-14"],
      ["chase:balance_transfer", "2027-01-13"],
    ]);
    expect(steps[0].callStepId).toBe("chase:apr_reduction");
    expect(steps[3].callStepId).toBeNull();
  });

  it("drops a won step and adds the bank's follow-up one statement cycle later", () => {
    const followUp = "Check the next statement for the new rate.";
    const steps = nextSteps(plan, [testCall({ outcome: testOutcome({ aprAfterBps: 1999, followUp }) })], TODAY);
    expect(steps.some((step) => step.id === "chase:apr_reduction")).toBe(false);
    expect(steps.find((step) => step.kind === "follow_up")).toMatchObject({
      title: followUp,
      dueOn: "2026-12-14",
      callStepId: null,
    });
  });

  it("moves a declined step out by six months", () => {
    expect(nextSteps(plan, [declined], TODAY).at(-1)).toMatchObject({
      id: "chase:apr_reduction:again",
      kind: "ask_again",
      dueOn: "2027-05-14",
      callStepId: "chase:apr_reduction",
    });
  });

  it("keeps a step open after a call with no clear answer", () => {
    const unclear = testCall({ outcome: testOutcome({ result: "unclear" }) });
    expect(nextSteps(plan, [unclear], TODAY)[0]).toMatchObject({ id: "chase:apr_reduction", kind: "plan", dueOn: TODAY });
  });

  it("never puts a step in the past", () => {
    const overdue = testStep({ kind: "credit_limit_increase" }, "2026-10-01");
    expect(nextSteps([overdue], [], TODAY)[0].dueOn).toBe(TODAY);
  });
});

describe("calendarEventsFor", () => {
  it("makes one event per step with a stable id", () => {
    expect(calendarEventsFor(nextSteps([aprStep], [], TODAY), "case-1")).toEqual([
      {
        uid: "case-1-chase:apr_reduction@haggle",
        date: TODAY,
        title: "Haggle: Ask Chase to lower your APR",
        description: aprStep.lever.why,
      },
    ]);
  });
});
