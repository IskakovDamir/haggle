import { cn } from "@/lib/utils";
import { WIN_FEE_PERCENT } from "./facts";
import { Section } from "./section";

/** Who does the work in a step: a language model, plain code, or the visitor. */
type Doer = "ai" | "code" | "you";

const DOER: Record<Doer, { label: string; className: string }> = {
  ai: { label: "AI", className: "bg-[#ede7ff] text-[#4b2bb8]" },
  code: { label: "Code", className: "bg-green-soft text-green" },
  you: { label: "You", className: "bg-lime text-ink" },
};

const STEPS: { title: string; doers: Doer[]; text: string }[] = [
  {
    title: "Read the statement",
    doers: ["ai", "code"],
    text: "Upload a PDF or a photo. Claude copies the bank, balance, APR, limit, fees and dates into a fixed schema. Code converts them to cents and cross-checks them. Only the last four digits of the card number are kept.",
  },
  {
    title: "Confirm the numbers",
    doers: ["you"],
    text: "Every field that was read is on one screen, editable, with a warning where something looks off. Nothing is calculated until you say it looks right.",
  },
  {
    title: "Count what the debt costs",
    doers: ["code"],
    text: "Interest burned in a year, how long the minimum payment takes, and how much of your limit you use. Pure functions over whole cents, covered by tests. No model does arithmetic.",
  },
  {
    title: "Build the plan",
    doers: ["code"],
    text: "Each ask gets a dollar value and a place in line: lower APR, annual fee, late fee, penalty rate, higher limit, balance transfer.",
  },
  {
    title: "Make the call",
    doers: ["ai", "you"],
    text: "The agent says it is an AI assistant, states only facts from your statement, and negotiates. In this build it is a practice call: you play the bank's representative, by voice when voice is switched on, otherwise by typing. Try saying no first.",
  },
  {
    title: "Check what the bank agreed to",
    doers: ["ai", "code"],
    text: "Claude reads the outcome from the transcript. Code then requires every number the bank granted to appear in the bank's own words. If one does not, the result is marked unclear and counts for nothing.",
  },
  {
    title: "Pay after a win",
    doers: ["code"],
    text: `First-year savings are computed by code. Haggle's fee is ${WIN_FEE_PERCENT} of them, paid through Stripe Checkout in test mode. No win, no fee.`,
  },
];

export function HowItWorksSection() {
  return (
    <Section
      id="how"
      eyebrow="04 How it works"
      title={
        <>
          From a statement to <em>a call</em>
        </>
      }
      lead="A language model reads and talks. Every number comes from deterministic code with tests. Each step says which one is at work."
    >
      <ol className="space-y-2.5">
        {STEPS.map((step, index) => (
          <li key={step.title} className="grid grid-cols-[2.5rem_1fr] gap-4 rounded-2xl border border-line bg-card p-5">
            <span aria-hidden className="tabular flex size-10 items-center justify-center rounded-xl bg-ink font-extrabold text-paper">
              {index + 1}
            </span>
            <div>
              <h3 className="flex flex-wrap items-center gap-2 text-lg leading-snug font-semibold">
                {step.title}
                {step.doers.map((doer) => (
                  <span
                    key={doer}
                    className={cn("rounded-full px-2 py-0.5 text-[0.6875rem] font-bold tracking-wider uppercase", DOER[doer].className)}
                  >
                    {DOER[doer].label}
                  </span>
                ))}
              </h3>
              <p className="mt-1 text-muted">{step.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </Section>
  );
}
