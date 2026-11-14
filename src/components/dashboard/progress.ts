// Where the visitor stands in the plan: which steps are won, which to ask again, and what comes next.
// Pure functions over the plan and the stored calls.
import { addDays, formatDate } from "@/lib/format";
import type { CallRecord, IsoDate, PlanStep } from "@/lib/types";
import { outcomeKind } from "@/components/win/outcome-kind";
import { addMonths, laterOf, localDateOf } from "./dates";
import type { CalendarEvent } from "./ics";

/** After a "no", banks tend to reconsider once a few more on-time payments are on file. */
export const ASK_AGAIN_AFTER_MONTHS = 6;
/** A bank's follow-up comes without a date, so we put it one statement cycle after the call. */
export const FOLLOW_UP_AFTER_DAYS = 30;

/** The plan step a call belongs to: the same `${cardId}:${kind}` id that PlanStep uses. */
export function stepIdOf(call: Pick<CallRecord, "cardId" | "goal">): string {
  return `${call.cardId}:${call.goal}`;
}

/** A call counts as a win only when code confirmed the bank's words. */
export function isWin(call: CallRecord): boolean {
  return call.outcome !== null && outcomeKind(call.outcome) === "win";
}

/** The calendar day a call happened. */
export function callDate(call: CallRecord): IsoDate {
  return localDateOf(call.endedAt ?? call.startedAt);
}

/** When to try a declined ask again. */
export function askAgainDate(call: CallRecord): IsoDate {
  return addMonths(callDate(call), ASK_AGAIN_AFTER_MONTHS);
}

/** The first step of the plan that has no win yet. Pass `needsCall` to look only at steps the agent can call about. */
export function firstOpenStep(
  plan: PlanStep[],
  calls: CallRecord[],
  options: { needsCall?: boolean; except?: string } = {},
): PlanStep | null {
  const won = new Set(calls.filter(isWin).map(stepIdOf));
  return (
    plan.find(
      (step) =>
        step.lever.eligible &&
        !won.has(step.id) &&
        step.id !== options.except &&
        (!options.needsCall || step.lever.needsCall),
    ) ?? null
  );
}

export type NextStep = {
  id: string;
  kind: "plan" | "ask_again" | "follow_up";
  title: string;
  detail: string;
  dueOn: IsoDate;
  /** The plan step to call about, when a call is the way to do it. */
  callStepId: string | null;
};

/**
 * Everything still to do, soonest first:
 * plan steps without a win (a declined one moves out by six months), and follow-ups the bank asked for on a win.
 */
export function nextSteps(plan: PlanStep[], calls: CallRecord[], today: IsoDate): NextStep[] {
  const finished = calls.filter((call) => call.outcome !== null);
  const steps: NextStep[] = [];

  for (const step of plan) {
    if (!step.lever.eligible) continue;
    const forStep = finished.filter((call) => stepIdOf(call) === step.id);
    if (forStep.some(isWin)) continue;

    const last = forStep.at(-1);
    const callStepId = step.lever.needsCall ? step.id : null;
    if (last?.outcome?.result === "declined") {
      const said = last.outcome.followUp ?? "Banks often say yes on a later ask.";
      steps.push({
        id: `${step.id}:again`,
        kind: "ask_again",
        title: step.lever.title,
        detail: `The bank said no on ${formatDate(callDate(last))}. ${said}`,
        dueOn: laterOf(askAgainDate(last), today),
        callStepId,
      });
    } else {
      steps.push({
        id: step.id,
        kind: "plan",
        title: step.lever.title,
        detail: step.lever.why,
        dueOn: laterOf(step.dueOn ?? today, today),
        callStepId,
      });
    }
  }

  for (const call of finished) {
    if (!isWin(call) || !call.outcome?.followUp) continue;
    steps.push({
      id: `${call.id}:follow-up`,
      kind: "follow_up",
      title: call.outcome.followUp,
      detail: "The bank asked for this on your winning call.",
      dueOn: laterOf(addDays(callDate(call), FOLLOW_UP_AFTER_DAYS), today),
      callStepId: null,
    });
  }

  // Array.prototype.sort is stable, so steps due on the same day keep the plan's order.
  return steps.sort((a, b) => a.dueOn.localeCompare(b.dueOn));
}

/** The next steps as all-day calendar events. The ids are stable, so importing the file again updates the events. */
export function calendarEventsFor(steps: NextStep[], caseId: string): CalendarEvent[] {
  return steps.map((step) => ({
    uid: `${caseId}-${step.id}@haggle`,
    date: step.dueOn,
    title: `Haggle: ${step.title}`,
    description: step.detail,
  }));
}
