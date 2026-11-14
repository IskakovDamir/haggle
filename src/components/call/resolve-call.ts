// From "?step=<cardId>:<kind>" to everything one call needs: the card, the plan step and the agent's brief.
// The engine and the negotiator may throw; here that becomes one calm sentence instead of a crashed page.
import { analyze } from "@/lib/engine";
import { buildBrief } from "@/lib/negotiator";
import type { CardAccount, CaseFile, IsoDate, LeverKind, NegotiationBrief, PlanStep } from "@/lib/types";
import { firstOpenStep } from "@/components/dashboard/progress";

const LEVER_KINDS: readonly LeverKind[] = [
  "apr_reduction",
  "annual_fee_waiver",
  "late_fee_refund",
  "credit_limit_increase",
  "balance_transfer",
  "penalty_apr_review",
];

/** Split a step id on its last colon, so a card id that contains a colon still parses. */
export function parseStepId(step: string | null): { cardId: string; kind: LeverKind } | null {
  if (!step) return null;
  const cut = step.lastIndexOf(":");
  if (cut <= 0) return null;
  const kind = LEVER_KINDS.find((known) => known === step.slice(cut + 1));
  return kind ? { cardId: step.slice(0, cut), kind } : null;
}

/** The link to the call screen for one plan step. */
export function callHref(stepId: string): string {
  return `/call?step=${encodeURIComponent(stepId)}`;
}

/** The plan for these cards, or null when the engine could not work it out. */
export function planFor(cards: CardAccount[], today: IsoDate): PlanStep[] | null {
  try {
    return analyze(cards, today).plan;
  } catch {
    return null;
  }
}

type WayOut = { href: string; label: string };
const TO_PLAN: WayOut = { href: "/plan", label: "Back to your plan" };
const TO_DASHBOARD: WayOut = { href: "/dashboard", label: "See your wins" };

export type CallPlan =
  | { ok: true; card: CardAccount; step: PlanStep; brief: NegotiationBrief }
  | { ok: false; title: string; message: string; next: WayOut };

const nothing = (title: string, message: string, next: WayOut = TO_PLAN): CallPlan => ({ ok: false, title, message, next });

/**
 * Find the step to call about and build the agent's brief for it.
 * With no step in the URL (the "Call" link in the header), take the first call in the plan that has no win yet.
 */
export function resolveCall(caseFile: CaseFile, stepParam: string | null, today: IsoDate): CallPlan {
  const plan = planFor(caseFile.cards, today);
  if (!plan) return nothing("Your plan is not ready", "We could not work out your plan just now. Please reload the page.");

  let step: PlanStep | null;
  if (stepParam === null) {
    step = firstOpenStep(plan, caseFile.calls, { needsCall: true });
    if (!step) {
      return nothing("No calls left", "Every call in your plan has a win. Your results are on the dashboard.", TO_DASHBOARD);
    }
  } else {
    const wanted = parseStepId(stepParam);
    step = wanted ? (plan.find((candidate) => candidate.id === `${wanted.cardId}:${wanted.kind}`) ?? null) : null;
    if (!step) return nothing("Step not found", "We could not find that step in your plan. Pick one from the plan.");
  }

  const card = caseFile.cards.find((candidate) => candidate.id === step.lever.cardId);
  if (!card) return nothing("Card not found", "The card for this step is no longer in your case.");
  if (!step.lever.eligible) {
    return nothing("Not available", step.lever.ineligibleReason ?? "This step is not available for this card.");
  }
  if (!step.lever.needsCall) return nothing("No call needed", "This step does not need a call. Your plan says how to do it.");

  try {
    return { ok: true, card, step, brief: buildBrief({ card, holderFirstName: caseFile.holderFirstName, lever: step.lever }) };
  } catch {
    return nothing("Call not ready", "We could not prepare this call just now. Please reload the page.");
  }
}
