import { LIMIT_INCREASE } from "@/lib/engine";
import { Section } from "./section";

/** What the agent can ask for in this build. Each line is a lever the engine knows, nothing more. */
const OUTCOMES = [
  {
    index: "i",
    title: "Less interest",
    asks: [
      "A call for a lower APR",
      "A review when you are paying the penalty rate",
      "A dated step to move the balance to a 0% card, if the calls do not get you there",
    ],
  },
  {
    index: "ii",
    title: "More room on the card",
    asks: [
      `A call for a higher limit when you use ${LIMIT_INCREASE.minUtilizationPct}% or more of it`,
      "The agent asks if it means a hard credit pull before it accepts",
      "Your credit use before and after, in numbers",
    ],
  },
  {
    index: "iii",
    title: "Fees back",
    asks: [
      "A call to waive the annual fee",
      "A refund of a late fee on your statement",
      "A statement credit counts too, when the bank offers one",
    ],
  },
];

export function OutcomesSection() {
  return (
    <Section
      id="what"
      eyebrow="03 The product"
      title={
        <>
          Three results, <em>one agent</em>
        </>
      }
      lead="Haggle is on the borrower's side. It finds what is worth asking for in your statement, negotiates the ask, and checks what was agreed. In this build the negotiation is a practice call."
    >
      <div className="grid gap-3 md:grid-cols-3">
        {OUTCOMES.map((outcome) => (
          <div key={outcome.title} className="rounded-2xl border border-line bg-card p-6">
            <div aria-hidden className="font-display text-6xl leading-none text-green">
              {outcome.index}
            </div>
            <h3 className="mt-2 text-xl font-semibold">{outcome.title}</h3>
            <ul className="mt-3 divide-y divide-line text-muted">
              {outcome.asks.map((ask) => (
                <li key={ask} className="py-2.5 first:pt-0 last:pb-0">
                  {ask}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p className="mt-6 max-w-[70ch] rounded-2xl border border-green/30 bg-green-soft p-5">
        <strong>What Haggle is not.</strong> It does not repair credit, settle debt or promise a credit score. It asks
        for things you already have the right to ask for yourself. It never asks for your bank login and never touches
        your accounts.
      </p>
    </Section>
  );
}
