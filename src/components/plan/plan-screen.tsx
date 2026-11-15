"use client";

import Image from "next/image";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Reveal } from "@/components/motion/reveal";
import { useCaseFile, withoutCard } from "@/lib/store";
import { NumbersBoundary } from "./numbers-boundary";
import { PlanView } from "./plan-view";
import { CALM_PANEL, INK_PANEL } from "./surfaces";

/** Grey blocks in the shape of the plan, shown until the case file has been read from the browser. */
function PlanSkeleton() {
  return (
    <div className="space-y-4" role="status" aria-label="Loading your plan">
      <div className="hg-shimmer h-7 w-28 rounded-full" />
      <div className="rounded-[32px] p-5 sm:rounded-[40px] sm:p-8 lg:p-10" style={INK_PANEL}>
        <div className="h-8 w-60 max-w-full animate-pulse rounded-xl bg-white/10" />
        <div className="mt-4 h-24 w-80 max-w-full animate-pulse rounded-2xl bg-white/10" />
        <div className="mt-8 grid gap-3 sm:grid-cols-3 sm:gap-4">
          <div className="h-32 animate-pulse rounded-[24px] bg-white/7" />
          <div className="h-32 animate-pulse rounded-[24px] bg-white/7" />
          <div className="h-32 animate-pulse rounded-[24px] bg-white/7" />
        </div>
      </div>
      <div className="hg-shimmer h-64 rounded-[28px]" />
    </div>
  );
}

function NoCardsYet() {
  return (
    <Reveal y={16} className="mx-auto max-w-[640px]">
      <div className="rounded-[32px] px-6 pt-5 pb-8 text-center sm:rounded-[40px] sm:px-11 sm:pt-[22px] sm:pb-12" style={CALM_PANEL}>
        <Image
          src="/app/3d/calendar-3d-lg.png"
          alt=""
          width={210}
          height={205}
          priority
          className="mx-auto h-auto w-[160px] select-none sm:w-[210px]"
        />
        <h1 className="mt-5 text-[clamp(28px,3.6vw,40px)] leading-[1.125] font-semibold text-hg-ink">
          No statement <em>yet</em>
        </h1>
        <p className="mt-3 text-base leading-6 font-medium text-muted">
          Your plan is built from a credit card statement. Upload one, try a sample, or type three numbers.
        </p>
        <Link href="/start" className={buttonVariants({ size: "lg", className: "mt-6" })}>
          Add a statement
        </Link>
      </div>
    </Reveal>
  );
}

/** /plan: waits for the browser's case file, then shows the plan, or the way to get one. */
export function PlanScreen() {
  const { caseFile, ready, update } = useCaseFile();

  if (!ready) return <PlanSkeleton />;
  if (!caseFile || caseFile.cards.length === 0) return <NoCardsYet />;

  // A new set of cards is a new calculation, so it also gets a fresh boundary.
  const cardsKey = caseFile.cards.map((card) => card.id).join("|");
  return (
    <NumbersBoundary key={cardsKey}>
      <PlanView
        caseFile={caseFile}
        onRemoveCard={(cardId) => update((current) => (current ? withoutCard(current, cardId) : current))}
      />
    </NumbersBoundary>
  );
}
