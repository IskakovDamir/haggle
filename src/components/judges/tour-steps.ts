// The guided tour for the Zimran Business Cup judges: one sample case from the form to a paid, shared win.
// Each step lives on one page and points at one element, marked in the markup with data-tour="…".

export type TourAdvance =
  /** The judge clicks the highlighted element (or `clickTarget`). */
  | "click"
  /** The judge reads and presses Next. */
  | "next"
  /** The judge moves on to the next step's page. */
  | "leave"
  /** The next step's element shows up on this page (the call starts). */
  | "appear";

export type TourStep = {
  id: string;
  /** The pathname this step lives on. null: any page (the closing step). */
  path: string | null;
  title: string;
  body: string;
  /** data-tour value of the element to highlight. */
  target?: string;
  /** data-tour value whose click moves the tour on, when it differs from `target`. */
  clickTarget?: string;
  advance: TourAdvance;
  /** What the judge is waiting on, shown under the body while the step needs an action. */
  hint?: string;
  /** Skipped when its element never shows up (no pay panel after a no-win). */
  optional?: boolean;
};

export const TOUR_STEPS: TourStep[] = [
  {
    id: "fill",
    path: "/missed",
    title: "Fill in Maria's example",
    body: "Maria is a sample cardholder. She missed one Chase payment, got a $40 late fee, and her APR jumped from 27.24% to 29.99%. One click fills in her numbers.",
    target: "fill-sample",
    advance: "click",
    hint: "Press the highlighted button",
  },
  {
    id: "worth",
    path: "/missed",
    title: "See what the call is worth",
    body: "Haggle lists each ask and prices it in dollars. A tested engine does the math. The AI never does arithmetic. Haggle's fee is 20% of the savings, and only after a win.",
    target: "missed-asks",
    advance: "next",
  },
  {
    id: "send",
    path: "/missed",
    title: "Send Haggle to call Chase",
    body: "Press the blue button. Nothing is charged, and the call is labelled as practice.",
    target: "missed-submit",
    advance: "leave",
    hint: "Press the highlighted button",
  },
  {
    id: "mode",
    path: "/call",
    title: "Pick how Haggle calls",
    body: "Phone: type your own number and your phone rings for real. You play the Chase rep, with your script on screen. Typing: no phone needed, you tap the bank's replies. Add a second phone to try the handoff to the cardholder.",
    target: "call-start",
    advance: "appear",
    hint: "Press the start button when you're ready",
  },
  {
    id: "play",
    path: "/call",
    title: "You're the bank now",
    body: "Haggle says it's an AI assistant and that the call is recorded. Then it asks for the fee and the old rate back. Push back and say no to part of it. Haggle counters, then reads back what you agreed. Hang up when you're done, then open the result.",
    target: "call-live",
    advance: "leave",
    hint: "Finish the call, then press See the result",
  },
  {
    id: "result",
    path: "/win",
    title: "Only what the bank said counts",
    body: "A model reads the transcript. Then code keeps only figures the bank actually said, including ones said in words. Savings and the fee come from the engine. If you said no to everything, you'll see an honest no-win and no fee.",
    target: "win-result",
    advance: "next",
  },
  {
    id: "share",
    path: "/win",
    title: "Share the win",
    body: "A signed win card for X, LinkedIn and stories. The server checks the call again before it signs.",
    target: "win-share",
    advance: "next",
    optional: true,
  },
  {
    id: "pay",
    path: "/win",
    title: "Pay only after a win",
    body: "Stripe test mode. Use card 4242 4242 4242 4242, any future date and any CVC. This step is optional.",
    target: "win-pay",
    advance: "next",
    optional: true,
  },
  {
    id: "done",
    path: null,
    title: "That's the whole loop",
    body: "Also worth a look: upload a statement and get a full plan, try the live coach for when you call the bank yourself, and see the Spanish version.",
    advance: "next",
  },
];

/**
 * Which step to show on this page. The current step when it lives here; else the first step ahead that
 * lives here (the judge moved on by themselves); else the first one behind (they went back). null: this
 * page is off the tour.
 */
export function stepOnPage(steps: TourStep[], current: number, pathname: string): number | null {
  const step = steps[current];
  if (step && (step.path === null || step.path === pathname)) return current;
  const ahead = steps.findIndex((candidate, index) => index > current && candidate.path === pathname);
  if (ahead !== -1) return ahead;
  const behind = steps.findIndex((candidate) => candidate.path === pathname);
  return behind === -1 ? null : behind;
}

/** Where to send a judge who wandered off: the last address seen for the step's page, else a sensible start. */
export function resumeHref(step: TourStep, seen: Record<string, string>): string {
  if (step.path === null) return "/judges";
  if (seen[step.path]) return seen[step.path];
  if (step.path === "/call") return "/demo";
  if (step.path === "/win") return "/calls";
  return step.path;
}
