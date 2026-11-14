"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/primitives";
import { Reveal } from "@/components/motion/reveal";
import { useCaseFile, withoutCard } from "@/lib/store";
import { NumbersBoundary } from "./numbers-boundary";
import { PlanView } from "./plan-view";

/** Grey blocks in the shape of the plan, shown until the case file has been read from the browser. */
function PlanSkeleton() {
  return (
    <div className="space-y-4" role="status" aria-label="Loading your plan">
      <div className="hg-shimmer h-7 w-28 rounded-full" />
      <div className="rounded-[32px] bg-hg-blue-soft p-5 sm:rounded-[40px] sm:p-8">
        <div className="hg-shimmer h-8 w-60 max-w-full rounded-xl" />
        <div className="hg-shimmer mt-4 h-24 w-80 max-w-full rounded-2xl" />
        <div className="mt-8 grid gap-3 sm:grid-cols-3 sm:gap-4">
          <div className="hg-shimmer h-32 rounded-[24px]" />
          <div className="hg-shimmer h-32 rounded-[24px]" />
          <div className="hg-shimmer h-32 rounded-[24px]" />
        </div>
      </div>
      <div className="hg-shimmer h-64 rounded-[32px]" />
    </div>
  );
}

function NoCardsYet() {
  return (
    <Reveal y={16} className="mx-auto max-w-xl">
      <Card className="p-6 text-center sm:rounded-[32px] sm:p-10">
        <h1 className="text-[clamp(28px,3.6vw,40px)] leading-[1.125] font-semibold">
          No statement <em>yet</em>
        </h1>
        <p className="mt-3 font-medium text-muted">
          Your plan is built from a credit card statement. Upload one, try a sample, or type three numbers.
        </p>
        <Link href="/start" className={buttonVariants({ size: "lg", className: "mt-6" })}>
          Add a statement
        </Link>
      </Card>
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
