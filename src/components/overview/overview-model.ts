// Everything the overview shows, worked out in one place. Pure: the engine and the existing helpers do the
// math, this only picks and combines their results, so no number on the screen is computed in a component.
import { analyze } from "@/lib/engine";
import type { Bps, CallRecord, CardAccount, CaseFile, Cents, IsoDate, PlanStep } from "@/lib/types";
import { callHref, planFor } from "@/components/call/resolve-call";
import { buildCallList } from "@/components/calls/call-list-model";
import { loweredAprBps } from "@/components/dashboard/debt-free";
import { firstOpenStep, isWin, nextSteps, type NextStep } from "@/components/dashboard/progress";
import { totalsFor } from "@/components/dashboard/totals";
import { cardsAfterWins } from "@/components/plan/apply-wins";
import { isSampleCard } from "@/components/start/sample-cards";
import { outcomeKind } from "@/components/win/outcome-kind";
import { interestSeries, type InterestSeries } from "./interest-series";

/** How many next steps and calls the overview lists before it links to the full page. */
export const OVERVIEW_LIST_LENGTH = 3;

export type CardRow = {
  /** The card as it stands after its wins: a waived fee is gone, a lowered rate is in force. */
  card: CardAccount;
  /** The statement's rate. */
  aprBeforeBps: Bps;
  /** The rate after the latest win that lowered it. null when no call has. */
  aprAfterBps: Bps | null;
  /** At least one confirmed win on this card. */
  won: boolean;
  /** The next call in the plan is about this card. */
  nextCall: boolean;
  sample: boolean;
  missedPayment: boolean;
};

export type Overview = {
  /** Interest over the next year at the rates in force now. */
  annualInterestCents: Cents;
  /** The same at the statement's rates, before any win. */
  annualInterestBeforeCents: Cents;
  /** First-year savings from confirmed wins. */
  savedCents: Cents;
  /** Confirmed wins that count toward the savings. */
  wins: number;
  /** Calls in the plan that were won, and how many calls the plan has. */
  callsWon: number;
  callsInPlan: number;
  /** Calls won as a share of the calls in the plan, 0 to 100. */
  callsWonPct: number;
  /** What the calls still to make could win in a year, at average results. */
  openValueCents: Cents;
  /** Saved so far plus what is still to win: the year's goal. */
  goalCents: Cents;
  /** Saved so far as a share of the goal, 0 to 100. */
  savedPct: number;
  /** The first call in the plan that has no win yet: where "New call" goes. */
  nextCall: PlanStep | null;
  cards: CardRow[];
  chart: InterestSeries;
  /** The next few steps, soonest first, and how many there are in all. */
  steps: NextStep[];
  stepCount: number;
  /** The latest calls, newest first. */
  recent: CallRecord[];
  hasSample: boolean;
};

/** The next call to make, as the "New call" button and the call screen see it. null when no call is left. */
export function nextCallStep(caseFile: CaseFile, today: IsoDate): PlanStep | null {
  const plan = planFor(caseFile.cards, today);
  return plan ? firstOpenStep(plan, caseFile.calls, { needsCall: true }) : null;
}

/** Where "New call" goes: the next open call, the call list when every call is won, or /start with no cards. */
export function newCallHref(caseFile: CaseFile | null, today: IsoDate): string {
  if (!caseFile || caseFile.cards.length === 0) return "/start";
  const next = nextCallStep(caseFile, today);
  return next ? callHref(next.id) : "/calls";
}

/** Newest first, by when the call started. ISO timestamps sort as text. */
export function latestCalls(calls: CallRecord[], count: number): CallRecord[] {
  return calls.toSorted((a, b) => b.startedAt.localeCompare(a.startedAt)).slice(0, count);
}

/** How a call ended, in one or two words, and whether it is a win. The same wording as the call history. */
export function callResult(call: CallRecord): { text: string; win: boolean } {
  if (!call.outcome) return { text: call.endedAt ? "No result" : "Not finished", win: false };
  switch (outcomeKind(call.outcome)) {
    case "win":
      return { text: call.outcome.result === "partial" ? "Partial win" : "Win", win: true };
    case "declined":
      return { text: "Declined", win: false };
    case "unconfirmed":
      return { text: "Not confirmed", win: false };
    case "unclear":
      return { text: "No answer", win: false };
  }
}

/** "voice", "typed" or "phone", for "voice practice call". */
export function modeLabel(mode: CallRecord["mode"] | string): string {
  if (mode === "voice") return "voice";
  if (mode === "phone") return "phone";
  return "typed";
}

/** The overview for one case. Throws when the engine does; the screen catches it and says so. */
export function overviewFor(caseFile: CaseFile, today: IsoDate): Overview {
  const { calls } = caseFile;
  const cardsNow = cardsAfterWins(caseFile.cards, calls);
  const now = analyze(cardsNow, today);
  const before = analyze(caseFile.cards, today);
  const list = buildCallList(now.plan, cardsNow, calls);
  const totals = totalsFor(calls);
  const nextCall = nextCallStep(caseFile, today);
  const plan = planFor(caseFile.cards, today) ?? [];
  const steps = nextSteps(plan, calls, today);

  const callsWon = list.groups.flatMap((group) => group.items).filter((item) => item.status.kind === "won").length;
  const goalCents = totals.savedCents + list.openValueCents;

  const cards: CardRow[] = cardsNow.map((card, index) => {
    const statement = caseFile.cards[index];
    return {
      card,
      aprBeforeBps: statement.purchaseAprBps,
      aprAfterBps: loweredAprBps(statement, calls),
      won: calls.some((call) => call.cardId === card.id && isWin(call)),
      nextCall: nextCall?.lever.cardId === card.id,
      sample: isSampleCard(card),
      missedPayment: Boolean(card.missedPayment),
    };
  });

  return {
    annualInterestCents: now.totals.annualInterestCents,
    annualInterestBeforeCents: before.totals.annualInterestCents,
    savedCents: totals.savedCents,
    wins: totals.wins,
    callsWon,
    callsInPlan: list.total,
    callsWonPct: list.total > 0 ? (callsWon / list.total) * 100 : 0,
    openValueCents: list.openValueCents,
    goalCents,
    savedPct: goalCents > 0 ? Math.min(100, (totals.savedCents / goalCents) * 100) : 0,
    nextCall,
    cards,
    chart: interestSeries(caseFile.cards, calls, today),
    steps: steps.slice(0, OVERVIEW_LIST_LENGTH),
    stepCount: steps.length,
    recent: latestCalls(calls, OVERVIEW_LIST_LENGTH),
    hasSample: caseFile.cards.some(isSampleCard),
  };
}
