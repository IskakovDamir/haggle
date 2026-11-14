"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { isSampleCard } from "@/components/start/sample-cards";
import { analyze } from "@/lib/engine";
import { todayIso } from "@/lib/format";
import type { CaseFile } from "@/lib/types";
import { isWin } from "@/components/dashboard/progress";
import { cardsAfterWins, winSummary } from "./apply-wins";
import { CardPanel } from "./card-panel";
import { Headline } from "./headline";
import { cardLabel, lastCallFor } from "./labels";
import { Levers } from "./levers";
import { PlanSteps } from "./plan-steps";

function Section({ title, lead, children }: { title: React.ReactNode; lead?: string; children: React.ReactNode }) {
  return (
    <section className="mt-16 sm:mt-20">
      <Reveal y={16}>
        <h2 className="text-[clamp(28px,3.4vw,40px)] leading-[1.125] font-semibold tracking-[-0.035em] text-hg-ink">{title}</h2>
        {lead && <p className="mt-3 max-w-[64ch] text-[17px] leading-7 font-medium tracking-[-0.01em] text-muted">{lead}</p>}
      </Reveal>
      <div className="mt-6">{children}</div>
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
  // The plan works from the cards as they stand after any wins: a won APR cut lowers the interest shown.
  const cards = useMemo(() => cardsAfterWins(caseFile.cards, caseFile.calls), [caseFile.cards, caseFile.calls]);
  const analysis = useMemo(() => analyze(cards, today), [cards, today]);
  const wins = winSummary(caseFile.calls);

  const cardNames = new Map(caseFile.cards.map((card) => [card.id, cardLabel(card)]));
  const analysisOf = new Map(analysis.cards.map((card) => [card.cardId, card]));
  const wonStep = (step: (typeof analysis.plan)[number]) => {
    const last = lastCallFor(caseFile.calls, step);
    return last !== null && isWin(last);
  };
  const firstCall = analysis.plan.find((step) => step.lever.needsCall && !wonStep(step)) ?? null;

  return (
    <div>
      <Headline
        name={caseFile.holderFirstName}
        totals={analysis.totals}
        cardCount={caseFile.cards.length}
        hasSampleCard={caseFile.cards.some(isSampleCard)}
        firstCall={firstCall}
        wins={wins}
      />

      <Section title={caseFile.cards.length === 1 ? "Your card" : "Your cards"}>
        <Stagger className="space-y-4">
          {cards.map((card) => {
            const numbers = analysisOf.get(card.id);
            return numbers ? (
              <StaggerItem key={card.id}>
                <CardPanel card={card} analysis={numbers} onRemove={() => onRemoveCard(card.id)} />
              </StaggerItem>
            ) : null;
          })}
        </Stagger>
        <Link href="/start" className={buttonVariants({ variant: "outline", className: "group mt-5" })}>
          <Plus className="size-4 transition-transform duration-300 group-hover:rotate-90" aria-hidden />
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
        <Reveal as="section" y={12} className="mt-16 rounded-[28px] border border-line/80 bg-hg-surface/70 p-5 sm:mt-20 sm:p-7">
          <h2 className="text-[13px] leading-[18px] font-semibold tracking-normal text-muted">Behind these numbers</h2>
          <ul className="mt-3 max-w-[80ch] list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted marker:text-hg-blue">
            {analysis.assumptions.map((sentence) => (
              <li key={sentence}>{sentence}</li>
            ))}
          </ul>
        </Reveal>
      )}
    </div>
  );
}
