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
    body: "Maria missed one Chase payment. One click fills in her numbers.",
    target: "fill-sample",
    advance: "click",
    hint: "Press it",
  },
  {
    id: "worth",
    path: "/missed",
    title: "What the call is worth",
    body: "Every ask, priced in dollars. Haggle takes 20%, only if it wins.",
    target: "missed-asks",
    advance: "next",
  },
  {
    id: "send",
    path: "/missed",
    title: "Send Haggle to call",
    body: "Nothing is charged.",
    target: "missed-submit",
    advance: "leave",
    hint: "Press it",
  },
  {
    id: "mode",
    path: "/call",
    title: "Get the call",
    body: "Type your number and your phone rings. You play Chase. No phone? Pick Typing.",
    target: "call-start",
    advance: "appear",
    hint: "Press start when ready",
  },
  {
    id: "play",
    path: "/call",
    title: "You’re the bank",
    body: "Say no. Push back. See how Haggle counters.",
    target: "call-live",
    advance: "leave",
    hint: "Hang up, then open the result",
  },
  {
    id: "result",
    path: "/win",
    title: "Only what you said counts",
    body: "Code checks every number against the transcript. No win, no fee.",
    target: "win-result",
    advance: "next",
  },
  {
    id: "share",
    path: "/win",
    title: "Share the win",
    body: "A verified card for X, LinkedIn and stories.",
    target: "win-share",
    advance: "next",
    optional: true,
  },
  {
    id: "pay",
    path: "/win",
    title: "Pay only after a win",
    body: "Test card 4242 4242 4242 4242, any date, any CVC.",
    target: "win-pay",
    advance: "next",
    optional: true,
  },
  {
    id: "done",
    path: null,
    title: "That’s it",
    body: "Want more? Try these:",
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
