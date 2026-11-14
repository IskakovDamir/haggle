// The call list: every call the plan needs, across every bank, with where each one stands. Pure.
import { askAgainDate } from "@/components/dashboard/progress";
import { lastCallFor } from "@/components/plan/labels";
import { outcomeKind } from "@/components/win/outcome-kind";
import type { CallRecord, CardAccount, Cents, IsoDate, PlanStep } from "@/lib/types";

export type CallStatus =
  | { kind: "todo" }
  | { kind: "won"; callId: string; savedCents: Cents }
  | { kind: "declined"; callId: string; askAgainOn: IsoDate }
  | { kind: "unclear"; callId: string };

export type CallItem = { step: PlanStep; status: CallStatus };

export type BankGroup = {
  cardId: string;
  bank: string;
  /** "Freedom Unlimited ending in 4417" */
  card: string;
  items: CallItem[];
};

export type CallList = {
  groups: BankGroup[];
  total: number;
  done: number;
  /** First-year value of the calls still to make, at the expected outcome. */
  openValueCents: Cents;
  /** First-year savings already won. */
  wonCents: Cents;
  /** The first call still to make, in plan order. */
  next: PlanStep | null;
};

function statusOf(step: PlanStep, calls: CallRecord[]): CallStatus {
  const last = lastCallFor(calls, step);
  if (!last?.outcome) return { kind: "todo" };
  switch (outcomeKind(last.outcome)) {
    case "win":
      return { kind: "won", callId: last.id, savedCents: last.savings?.annualSavingsCents ?? 0 };
    case "declined":
      return { kind: "declined", callId: last.id, askAgainOn: askAgainDate(last) };
    default:
      return { kind: "unclear", callId: last.id };
  }
}

const cardName = (card: CardAccount) =>
  [card.cardName, card.last4 ? `ending in ${card.last4}` : ""].filter(Boolean).join(" ") || "Credit card";

/** The plan's call steps, grouped by card in the order each card first comes up. */
export function buildCallList(plan: PlanStep[], cards: CardAccount[], calls: CallRecord[]): CallList {
  const groups = new Map<string, BankGroup>();
  const items: CallItem[] = [];

  for (const step of plan) {
    if (!step.lever.needsCall) continue;
    const card = cards.find((c) => c.id === step.lever.cardId);
    if (!card) continue;
    const item = { step, status: statusOf(step, calls) };
    items.push(item);
    const group = groups.get(card.id) ?? { cardId: card.id, bank: card.issuerName || "Bank", card: cardName(card), items: [] };
    group.items.push(item);
    groups.set(card.id, group);
  }

  const open = items.filter((item) => item.status.kind === "todo" || item.status.kind === "unclear");
  return {
    groups: [...groups.values()],
    total: items.length,
    done: items.length - open.length,
    openValueCents: open.reduce((sum, item) => sum + item.step.lever.potentialAnnualCents, 0),
    wonCents: items.reduce((sum, item) => sum + (item.status.kind === "won" ? item.status.savedCents : 0), 0),
    next: open[0]?.step ?? null,
  };
}
