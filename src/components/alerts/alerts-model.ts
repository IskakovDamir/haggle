// Alerts: the dated things in the case that need the visitor, each with one way to act on it.
// Pure. Every date and amount comes from the engine, the plan or a stored call; nothing here is invented.
import { analyze, WIN_FEE_BPS } from "@/lib/engine";
import { addDays, formatApr, formatDate, formatPoints } from "@/lib/format";
import { BUREAU_REPORTING_DAYS } from "@/lib/missed";
import { formatCents, formatShort } from "@/lib/money";
import type { CallRecord, CardAccount, CaseFile, IsoDate, PlanStep } from "@/lib/types";
import { goalLabel } from "@/components/call/ask";
import { callHref } from "@/components/call/resolve-call";
import { askAgainDate, callDate, FOLLOW_UP_AFTER_DAYS, isWin, stepIdOf } from "@/components/dashboard/progress";
import { countedWins, feeIsDue } from "@/components/dashboard/totals";

export type AlertKind = "promo_ending" | "plan_step" | "ask_again" | "follow_up" | "fee_due" | "missed_no_call";

/** "now": due today or overdue. "soon": within the next 30 days. "later": further out. */
export type AlertWhen = "now" | "soon" | "later";

export type Alert = {
  id: string;
  kind: AlertKind;
  /** The day it is about: the promo's last day, the step's due date, the day of the call. */
  date: IsoDate;
  when: AlertWhen;
  title: string;
  detail: string;
  /** A few words for the top bar: "Capital One promo ends in 41 days". */
  short: string;
  cardId: string | null;
  action: { href: string; label: string };
};

/** How far ahead an alert counts as coming soon. */
export const SOON_DAYS = 30;

/** Kinds that sort first when two alerts share a date: money and deadlines before reminders. */
const KIND_ORDER: readonly AlertKind[] = ["missed_no_call", "promo_ending", "fee_due", "plan_step", "ask_again", "follow_up"];

const bankOf = (card: CardAccount | undefined) => card?.issuerName.trim() || "Your bank";

function whenOf(date: IsoDate, today: IsoDate): AlertWhen {
  if (date <= today) return "now";
  return date <= addDays(today, SOON_DAYS) ? "soon" : "later";
}

/** "today", "in 1 day", "in 41 days" */
function inDays(days: number): string {
  if (days <= 0) return "today";
  return days === 1 ? "in 1 day" : `in ${days} days`;
}

/** "Nov 14": the short date for the top bar. */
const shortDate = (iso: IsoDate) => formatDate(iso).replace(/, \d{4}$/, "");

const resultHref = (call: CallRecord) => `/win?call=${encodeURIComponent(call.id)}`;

/** Finished calls about one plan step, oldest first. */
function finishedFor(step: PlanStep, calls: CallRecord[]): CallRecord[] {
  return calls
    .filter((call) => call.outcome !== null && stepIdOf(call) === step.id)
    .sort((a, b) => a.startedAt.localeCompare(b.startedAt));
}

/** Every alert in the case, soonest first. Throws only when the engine does; callers decide what to show then. */
export function alertsFor(caseFile: CaseFile, today: IsoDate): Alert[] {
  const { cards, calls } = caseFile;
  const cardById = new Map(cards.map((card) => [card.id, card]));
  const analysis = analyze(cards, today);
  const alerts: Alert[] = [];
  const add = (alert: Omit<Alert, "when">) => alerts.push({ ...alert, when: whenOf(alert.date, today) });

  // A promo rate that is about to end: after that day the card charges its regular rate.
  for (const numbers of analysis.cards) {
    const card = cardById.get(numbers.cardId);
    if (!card?.promo || numbers.promoEndsInDays === null) continue;
    const bank = bankOf(card);
    add({
      id: `${card.id}:promo`,
      kind: "promo_ending",
      date: card.promo.endsOn,
      title: `${bank} promo ends ${inDays(numbers.promoEndsInDays)}`,
      detail: `The ${formatApr(card.promo.aprBps)} promo rate ends on ${formatDate(card.promo.endsOn)}. After that the rate is ${formatApr(card.purchaseAprBps)}.`,
      short: `${bank} promo ends ${inDays(numbers.promoEndsInDays)}`,
      cardId: card.id,
      action: { href: "/plan", label: "See your plan" },
    });
  }

  for (const step of analysis.plan) {
    if (!step.lever.eligible) continue;
    const finished = finishedFor(step, calls);
    if (finished.some(isWin)) continue;
    const card = cardById.get(step.lever.cardId);
    const bank = bankOf(card);
    const last = finished.at(-1);

    // The bank said no: ask again once more on-time payments are on file, on the date the plan sets.
    if (last?.outcome?.result === "declined") {
      const again = askAgainDate(last);
      const said = last.outcome.followUp ?? "Banks often say yes on a later ask.";
      add({
        id: `${step.id}:again`,
        kind: "ask_again",
        date: again,
        title: step.lever.title,
        detail: `${bank} said no on ${formatDate(callDate(last))}. ${said}`,
        short: `Ask ${bank} again on ${shortDate(again)}`,
        cardId: step.lever.cardId,
        action:
          step.lever.needsCall && again <= today
            ? { href: callHref(step.id), label: "Call again" }
            : { href: "/calls", label: "See your calls" },
      });
      continue;
    }

    // Steps the plan puts on a later date: a limit increase, a balance transfer.
    if (step.dueOn !== null) {
      const due = step.dueOn <= today;
      add({
        id: step.id,
        kind: "plan_step",
        date: step.dueOn,
        title: step.lever.title,
        detail: step.lever.why,
        short: `${goalLabel(step.lever.kind)} ${due ? "is due" : `due ${shortDate(step.dueOn)}`}`,
        cardId: step.lever.cardId,
        action:
          step.lever.needsCall && due
            ? { href: callHref(step.id), label: "Start the call" }
            : { href: "/plan", label: step.lever.needsCall ? "See your plan" : "See how" },
      });
    }
  }

  // What the bank asked for on a winning call. It comes without a date, so it lands one statement later.
  for (const call of calls) {
    if (!isWin(call) || !call.outcome?.followUp) continue;
    const bank = bankOf(cardById.get(call.cardId));
    const date = addDays(callDate(call), FOLLOW_UP_AFTER_DAYS);
    add({
      id: `${call.id}:follow-up`,
      kind: "follow_up",
      date,
      title: call.outcome.followUp,
      detail: `${bank} asked for this on your ${goalLabel(call.goal).toLowerCase()} call on ${formatDate(callDate(call))}.`,
      short: `Follow up with ${bank} on ${shortDate(date)}`,
      cardId: call.cardId,
      action: { href: resultHref(call), label: "Open the result" },
    });
  }

  // Wins whose fee is not paid yet. Only the wins that count toward the totals, so a replaced win is not billed twice.
  for (const call of countedWins(calls).filter(feeIsDue)) {
    const bank = bankOf(cardById.get(call.cardId));
    const fee = call.savings?.feeCents ?? 0;
    add({
      id: `${call.id}:fee`,
      kind: "fee_due",
      date: callDate(call),
      title: `Pay after your win: ${formatCents(fee)}`,
      detail: `Your ${goalLabel(call.goal).toLowerCase()} call with ${bank} saves ${formatCents(call.savings?.annualSavingsCents ?? 0)} in the first year. Haggle's fee is ${formatPoints(WIN_FEE_BPS)}% of that.`,
      short: `${formatCents(fee)} fee waiting for your ${bank} win`,
      cardId: call.cardId,
      action: { href: resultHref(call), label: "Pay after your win" },
    });
  }

  // A missed payment nobody has called about yet. Sooner is better: banks forgive more before it is reported.
  for (const card of cards) {
    if (!card.missedPayment) continue;
    const called = calls.some((call) => call.cardId === card.id && call.goal === "missed_payment" && call.outcome !== null);
    if (called) continue;
    const bank = bankOf(card);
    const daysLate = card.missedPayment.daysLate;
    const step = analysis.plan.find((candidate) => candidate.id === `${card.id}:missed_payment` && candidate.lever.eligible);
    const fee = card.lateFeeCents > 0 ? ` The ${formatShort(card.lateFeeCents)} late fee can be part of the ask.` : "";
    const reporting =
      daysLate !== null && daysLate > 0 && daysLate < BUREAU_REPORTING_DAYS
        ? ` It is ${daysLate} ${daysLate === 1 ? "day" : "days"} late. Late payments reach the credit bureaus at ${BUREAU_REPORTING_DAYS} days.`
        : "";
    add({
      id: `${card.id}:missed`,
      kind: "missed_no_call",
      date: today,
      title: `Missed payment on ${bank}: no call yet`,
      detail: `Banks often forgive one late payment as a courtesy, if you ask.${fee}${reporting}`,
      short: `Missed payment on ${bank}: no call yet`,
      cardId: card.id,
      action: step ? { href: callHref(step.id), label: "Start the call" } : { href: "/plan", label: "See your plan" },
    });
  }

  const rank = (alert: Alert) => KIND_ORDER.indexOf(alert.kind);
  return alerts.sort((a, b) => a.date.localeCompare(b.date) || rank(a) - rank(b));
}

/** A promo ending within this many days leads the top bar: the jump to the regular rate costs the most. */
export const PROMO_HEADLINE_DAYS = 90;

/** The one alert for the top bar: a promo about to end first, then whatever is due, then the soonest. */
export function headlineAlert(alerts: Alert[], today: IsoDate): Alert | null {
  const horizon = addDays(today, PROMO_HEADLINE_DAYS);
  const promo = alerts.find((alert) => alert.kind === "promo_ending" && alert.date <= horizon);
  return promo ?? alerts.find((alert) => alert.when === "now") ?? alerts[0] ?? null;
}
