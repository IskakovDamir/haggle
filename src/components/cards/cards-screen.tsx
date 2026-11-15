"use client";

import { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Phone, Plus } from "lucide-react";
import { goalLabel } from "@/components/call/ask";
import { Notice, PageSkeleton } from "@/components/call/page-states";
import { Stagger, StaggerItem } from "@/components/motion/reveal";
import { WonCheck } from "@/components/plan/animated";
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
import { CardSheet, INK_GRADIENT } from "./card-sheet";
import { cardsView, type CardEntry } from "./cards-model";

/** Under each card: the missed payment, the wins on it, and the calls still open. */
function CardFooter({ entry }: { entry: CardEntry }) {
  const missed = entry.card.missedPayment;
  return (
    <div className="mt-3 flex flex-col gap-2 rounded-[28px] bg-white p-5">
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
      <div className="relative">
        <Image
          src="/app/3d/card-chase-3d.png"
          alt=""
          width={260}
          height={195}
          priority
          className="pointer-events-none absolute -top-[27px] right-5 hidden h-[195px] w-[260px] select-none xl:block"
        />
        <PageTitle
          title={count === 1 ? "My card" : "My cards"}
          lead="Each card as it stands today, after any wins. The numbers come from your statements."
        />
      </div>

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
            <CardSheet card={entry.card} analysis={entry.analysis} onRemove={() => onRemove(entry.card.id)} />
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

/** Nothing in the case yet: the dark wallet panel with one way forward. */
function NoCards() {
  return (
    <section
      className={cn(
        "mx-auto max-w-[640px] overflow-hidden rounded-[32px] px-6 pt-[22px] pb-10 text-center text-white sm:rounded-[40px] sm:pb-12",
        INK_GRADIENT,
      )}
    >
      <Image
        src="/app/3d/wallet-3d.png"
        alt=""
        width={210}
        height={235}
        priority
        className="pointer-events-none mx-auto h-auto w-[170px] select-none sm:w-[210px]"
      />
      <h1 className="mt-10 text-[clamp(28px,4vw,34px)] leading-[1.15] font-semibold tracking-[-0.035em] text-white sm:mt-16">
        No cards yet
      </h1>
      <p className="mx-auto mt-3 max-w-[420px] text-[16px] leading-6 text-white/68">
        Add a credit card statement, from any bank. Upload one, try a sample, or type three numbers.
      </p>
      <Link
        href="/start"
        className={cn(buttonVariants({ size: "lg" }), "mt-6 bg-white text-hg-ink shadow-none hover:bg-white hover:shadow-none hover:brightness-95")}
      >
        Add a statement
      </Link>
    </section>
  );
}

/** /cards: every card in the case, with its numbers, its wins, and a way to remove it. */
export function CardsScreen() {
  const { caseFile, ready, update } = useCaseFile();
  const clock = useClock();
  if (!ready || !clock) return <PageSkeleton />;
  if (!caseFile || caseFile.cards.length === 0) return <NoCards />;
  return (
    <CardsBody
      caseFile={caseFile}
      today={clock.today}
      onRemove={(cardId) => update((current) => (current ? withoutCard(current, cardId) : current))}
    />
  );
}
