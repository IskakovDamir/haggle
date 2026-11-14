"use client";

import { useCaseFile } from "@/lib/store";
import type { CaseFile, IsoDate } from "@/lib/types";
import { useToday } from "@/components/call/clock";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { EmptyState, Notice, PageSkeleton } from "@/components/call/page-states";
import { planFor } from "@/components/call/resolve-call";
import { CallHistory } from "./call-history";
import { debtFreeFor, type DebtFree } from "./debt-free";
import { DebtFreeCard } from "./debt-free-card";
import { NextSteps } from "./next-steps";
import { nextSteps } from "./progress";
import { Scoreboard } from "./scoreboard";
import { StartOver } from "./start-over";
import { totalsFor } from "./totals";

/** "/dashboard": paid versus saved, the debt-free dates, what comes next, and every call. */
export function DashboardScreen() {
  const { caseFile, ready, update } = useCaseFile();

  if (!ready) return <PageSkeleton />;
  if (!caseFile || caseFile.cards.length === 0) {
    return (
      <EmptyState title="Nothing here yet">
        Your wins, your debt-free date and your next steps show up here. Start with a card statement.
      </EmptyState>
    );
  }
  return <Dashboard caseFile={caseFile} onClear={() => update(() => null)} />;
}

/** The engine's simulations for every card that carries a balance. null when the engine could not run them. */
function debtFreeByCard(caseFile: CaseFile, today: IsoDate): Map<string, DebtFree> | null {
  try {
    return new Map(
      caseFile.cards
        .filter((card) => card.balanceCents > 0)
        .map((card) => [card.id, debtFreeFor(card, caseFile.calls, today)]),
    );
  } catch {
    return null;
  }
}

function Dashboard({ caseFile, onClear }: { caseFile: CaseFile; onClear: () => void }) {
  const today = useToday();
  const plan = planFor(caseFile.cards, today);
  const debtFree = debtFreeByCard(caseFile, today);

  return (
    <div className="flex flex-col gap-16 sm:gap-20">
      <Scoreboard totals={totalsFor(caseFile.calls)} />

      <section aria-labelledby="debt-free">
        <Reveal y={16}>
          <h2 id="debt-free" className="text-[clamp(28px,3.4vw,40px)] leading-[1.125] font-semibold text-hg-ink">
            Your debt-free date
          </h2>
          <p className="mt-2 text-[17px] leading-7 font-medium tracking-[-0.01em] text-muted">
            If you pay only the minimum and add nothing to the balance.
          </p>
        </Reveal>
        {debtFree === null ? (
          <Notice className="mt-4">We could not work out the debt-free dates just now. Please reload the page.</Notice>
        ) : debtFree.size === 0 ? (
          <Notice className="mt-4">None of your cards carries a balance, so there is no debt to pay down.</Notice>
        ) : (
          <Stagger className="mt-5 grid items-start gap-4 lg:grid-cols-2">
            {caseFile.cards.map((card) => {
              const forCard = debtFree.get(card.id);
              return forCard ? (
                <StaggerItem key={card.id}>
                  <DebtFreeCard card={card} debtFree={forCard} />
                </StaggerItem>
              ) : null;
            })}
          </Stagger>
        )}
      </section>

      {plan === null ? (
        <Notice>We could not work out your next steps just now. Please reload the page.</Notice>
      ) : (
        <NextSteps steps={nextSteps(plan, caseFile.calls, today)} caseId={caseFile.id} today={today} />
      )}

      <CallHistory calls={caseFile.calls} cards={caseFile.cards} />

      <Reveal y={12} className="border-t border-line pt-6">
        <StartOver onClear={onClear} />
      </Reveal>
    </div>
  );
}
