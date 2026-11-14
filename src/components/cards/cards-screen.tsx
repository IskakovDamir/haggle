"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowRight, Phone, Plus } from "lucide-react";
import { goalLabel } from "@/components/call/ask";
import { EmptyState, Notice, PageSkeleton } from "@/components/call/page-states";
import { Stagger, StaggerItem } from "@/components/motion/reveal";
import { WonCheck } from "@/components/plan/animated";
import { CardPanel } from "@/components/plan/card-panel";
import { CountUp } from "@/components/plan/count-up";
import { caption, PageTitle, Pill } from "@/components/site/app-ui";
import { useClock } from "@/components/site/use-clock";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/primitives";
import { formatApr, formatDate } from "@/lib/format";
import { reasonLabel } from "@/lib/missed";
import { formatDollars } from "@/lib/money";
import { useCaseFile, withoutCard } from "@/lib/store";
import type { CaseFile, IsoDate } from "@/lib/types";
import { cn } from "@/lib/utils";
import { cardsView, type CardEntry } from "./cards-model";

/** Under each card: the missed payment, the wins on it, and the calls still open. */
function CardFooter({ entry }: { entry: CardEntry }) {
  const missed = entry.card.missedPayment;
  return (
    <div className="mt-3 flex flex-col gap-2 rounded-[20px] bg-white p-4 sm:p-5">
      {missed && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Badge tone="leak">Missed payment</Badge>
          <span className="font-medium text-hg-ink-2">
            {reasonLabel(missed.reason)}
            {missed.daysLate !== null && missed.daysLate > 0 && ` · ${missed.daysLate} ${missed.daysLate === 1 ? "day" : "days"} late`}
            {missed.paidSince && " · paid since"}
          </span>
        </div>
      )}

      {entry.aprAfterBps !== null && (
        <p className={cn(caption, "flex flex-wrap items-center gap-2 text-hg-muted")}>
          APR on the statement <span className="line-through">{formatApr(entry.aprBeforeBps)}</span>
          <ArrowRight className="size-3" aria-label="now" />
          <span className="text-hg-blue">{formatApr(entry.aprAfterBps)}</span>
        </p>
      )}

      {entry.wins.length > 0 ? (
        <ul className="flex flex-col gap-1.5">
          {entry.wins.map((win) => (
            <li key={win.callId}>
              <Link
                href={`/win?call=${encodeURIComponent(win.callId)}`}
                className="flex flex-wrap items-center gap-x-2.5 gap-y-1 rounded-[14px] bg-hg-surface px-3.5 py-2.5 text-sm transition-colors hover:bg-hg-blue-soft/70"
              >
                <WonCheck className="size-4" />
                <span className="font-semibold text-hg-ink">{goalLabel(win.goal)}</span>
                <span className="font-medium text-hg-muted">{formatDate(win.date)}</span>
                {win.savedCents > 0 && (
                  <span className="tabular ml-auto font-semibold text-hg-blue">saves {formatDollars(win.savedCents)} a year</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm font-medium text-hg-muted">No wins on this card yet.</p>
      )}

      {entry.openCalls > 0 && (
        <Link href="/calls" className={cn(caption, "group inline-flex w-fit items-center gap-1.5 text-hg-blue")}>
          <Phone className="size-3.5" aria-hidden />
          {entry.openCalls} {entry.openCalls === 1 ? "call" : "calls"} still to make
          <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
        </Link>
      )}
    </div>
  );
}

function CardsBody({ caseFile, today, onRemove }: { caseFile: CaseFile; today: IsoDate; onRemove: (cardId: string) => void }) {
  const view = useMemo(() => {
    try {
      return cardsView(caseFile, today);
    } catch {
      return null;
    }
  }, [caseFile, today]);

  if (!view) {
    return (
      <Notice tone="alarm">
        We could not work out the numbers for your cards just now. They are safe in this browser. Please reload the page.
      </Notice>
    );
  }

  const count = view.entries.length;
  return (
    <div>
      <PageTitle
        title={count === 1 ? "My card" : "My cards"}
        lead="Each card as it stands today, after any wins. The numbers come from your statements."
      />

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Pill tone="white" className="tabular">
          {count} {count === 1 ? "card" : "cards"}
        </Pill>
        <Pill tone="white" className="tabular">
          <CountUp value={view.totalBalanceCents} format="dollars" /> owed
        </Pill>
        <Pill tone="soft" className="tabular">
          <CountUp value={view.annualInterestCents} format="dollars" /> a year in interest
        </Pill>
      </div>

      <Stagger className="flex flex-col gap-6">
        {view.entries.map((entry) => (
          <StaggerItem key={entry.card.id}>
            <CardPanel card={entry.card} analysis={entry.analysis} onRemove={() => onRemove(entry.card.id)} />
            <CardFooter entry={entry} />
          </StaggerItem>
        ))}
      </Stagger>

      <Link href="/start" className={buttonVariants({ variant: "outline", className: "group mt-6 bg-white" })}>
        <Plus className="size-4 transition-transform duration-300 group-hover:rotate-90" aria-hidden />
        Add a card
      </Link>
    </div>
  );
}

/** /cards: every card in the case, with its numbers, its wins, and a way to remove it. */
export function CardsScreen() {
  const { caseFile, ready, update } = useCaseFile();
  const clock = useClock();
  if (!ready || !clock) return <PageSkeleton />;
  if (!caseFile || caseFile.cards.length === 0) {
    return (
      <EmptyState title="No cards yet">
        Add a credit card statement, from any bank. Upload one, try a sample, or type three numbers.
      </EmptyState>
    );
  }
  return (
    <CardsBody
      caseFile={caseFile}
      today={clock.today}
      onRemove={(cardId) => update((current) => (current ? withoutCard(current, cardId) : current))}
    />
  );
}
