"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { isSampleCard } from "@/components/start/sample-cards";
import { analyze } from "@/lib/engine";
import { todayIso } from "@/lib/format";
import type { CaseFile } from "@/lib/types";
import { CardPanel } from "./card-panel";
import { Headline } from "./headline";
import { cardLabel, lastCallFor } from "./labels";
import { Levers } from "./levers";
import { PlanSteps } from "./plan-steps";

function Section({ title, lead, children }: { title: React.ReactNode; lead?: string; children: React.ReactNode }) {
  return (
    <section className="mt-14">
      <h2 className="text-2xl leading-[1.15] font-extrabold sm:text-3xl">{title}</h2>
      {lead && <p className="mt-2 max-w-[64ch] text-muted">{lead}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

/**
 * The plan for one case. Every number on this screen comes from `analyze`; this component only lays
 * them out. `analyze` may throw, and the boundary around this component turns that into a sentence.
 */
export function PlanView({ caseFile, onRemoveCard }: { caseFile: CaseFile; onRemoveCard: (cardId: string) => void }) {
  // Read the clock once, in the browser, so a render at midnight cannot disagree with itself.
  const [today] = useState(todayIso);
  const analysis = useMemo(() => analyze(caseFile.cards, today), [caseFile.cards, today]);

  const cardNames = new Map(caseFile.cards.map((card) => [card.id, cardLabel(card)]));
  const analysisOf = new Map(analysis.cards.map((card) => [card.cardId, card]));
  const wonAlready = (result: string | undefined) => result === "won" || result === "partial";
  const firstCall =
    analysis.plan.find((step) => step.lever.needsCall && !wonAlready(lastCallFor(caseFile.calls, step)?.outcome?.result)) ?? null;

  return (
    <div>
      <Headline
        name={caseFile.holderFirstName}
        totals={analysis.totals}
        cardCount={caseFile.cards.length}
        hasSampleCard={caseFile.cards.some(isSampleCard)}
        firstCall={firstCall}
      />

      <Section title={caseFile.cards.length === 1 ? "Your card" : "Your cards"}>
        <div className="space-y-3">
          {caseFile.cards.map((card) => {
            const numbers = analysisOf.get(card.id);
            return numbers ? (
              <CardPanel key={card.id} card={card} analysis={numbers} onRemove={() => onRemoveCard(card.id)} />
            ) : null;
          })}
        </div>
        <Link href="/start" className={buttonVariants({ variant: "outline", className: "mt-4" })}>
          <Plus className="size-4" aria-hidden />
          Add another card
        </Link>
      </Section>

      <Section
        title={
          <>
            What is worth <em>asking for</em>
          </>
        }
        lead="Each ask is decided by code from the numbers on your statement, with its value for the first year."
      >
        <Levers levers={analysis.levers} cardNames={cardNames} />
      </Section>

      <Section
        title={
          <>
            Your plan, <em>in order</em>
          </>
        }
        lead="Calls for money come first. Calls in this build are practice calls: you play the bank's representative and the agent negotiates with you."
      >
        <PlanSteps steps={analysis.plan} calls={caseFile.calls} cardNames={cardNames} />
      </Section>

      {analysis.assumptions.length > 0 && (
        <section className="mt-14 border-t border-line pt-6">
          <h2 className="text-xs font-bold tracking-widest text-muted uppercase">Behind these numbers</h2>
          <ul className="mt-3 max-w-[80ch] list-disc space-y-1.5 pl-5 text-sm text-muted">
            {analysis.assumptions.map((sentence) => (
              <li key={sentence}>{sentence}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
