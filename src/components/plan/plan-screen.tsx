"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/primitives";
import { useCaseFile, withoutCard } from "@/lib/store";
import { NumbersBoundary } from "./numbers-boundary";
import { PlanView } from "./plan-view";

/** Grey blocks in the shape of the plan, shown until the case file has been read from the browser. */
function PlanSkeleton() {
  return (
    <div className="animate-pulse space-y-4" role="status" aria-label="Loading your plan">
      <div className="h-6 w-56 rounded-lg bg-ink/7" />
      <div className="h-24 w-72 max-w-full rounded-2xl bg-ink/10" />
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="h-28 rounded-2xl bg-ink/7" />
        <div className="h-28 rounded-2xl bg-ink/7" />
        <div className="h-28 rounded-2xl bg-ink/7" />
      </div>
      <div className="h-64 rounded-2xl bg-ink/7" />
    </div>
  );
}

function NoCardsYet() {
  return (
    <Card className="mx-auto max-w-xl p-6 text-center sm:p-10">
      <h1 className="text-2xl leading-tight font-extrabold sm:text-3xl">
        No statement <em>yet</em>
      </h1>
      <p className="mt-3 text-muted">
        Your plan is built from a credit card statement. Upload one, try a sample, or type three numbers.
      </p>
      <Link href="/start" className={buttonVariants({ size: "lg", className: "mt-6" })}>
        Add a statement
      </Link>
    </Card>
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
