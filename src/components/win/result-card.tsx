"use client";

import { ArrowRight, Quote } from "lucide-react";
import { motion } from "framer-motion";
import { formatCents } from "@/lib/money";
import type { CallOutcome, Savings } from "@/lib/types";
import type { Change } from "./changes";

/** "APR 27.24% -> 19.99%", read out as "APR 27.24% to 19.99%". */
function ChangeLine({ change, big }: { change: Change; big: boolean }) {
  return (
    <p
      className={
        big
          ? "tabular text-[clamp(1.75rem,7vw,3.5rem)] leading-[1.05] font-extrabold tracking-tight"
          : "tabular text-lg font-bold sm:text-xl"
      }
    >
      {change.label}{" "}
      {change.before !== null && (
        <>
          <span className="opacity-55">{change.before}</span>
          <ArrowRight className="mx-1.5 inline size-[0.7em] align-baseline" aria-hidden />
          <span className="sr-only"> to </span>
        </>
      )}
      <span className="whitespace-nowrap">{change.after}</span>
    </p>
  );
}

/** The lime card for a confirmed win: before and after, what it is worth, and the bank's words behind it. */
export function ResultCard({
  bankName,
  outcome,
  changes,
  savings,
}: {
  bankName: string;
  outcome: CallOutcome;
  changes: Change[];
  savings: Savings;
}) {
  const [headline, ...rest] = changes;
  const quote = outcome.evidence[0]?.quote ?? null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="rounded-3xl bg-lime p-6 text-ink sm:p-10"
    >
      <p className="text-xs font-semibold tracking-widest uppercase opacity-70">
        {outcome.result === "partial" ? "Partial win" : "Win"} · practice call
      </p>
      <h1 className="mt-2 text-2xl font-extrabold sm:text-3xl">
        {bankName} said <em>{outcome.result === "partial" ? "yes to part of it" : "yes"}</em>
      </h1>

      <div className="mt-6 flex flex-col gap-2">
        {headline && <ChangeLine change={headline} big />}
        {rest.map((change) => (
          <ChangeLine key={change.label} change={change} big={false} />
        ))}
      </div>

      <p className="mt-4 font-semibold opacity-75">
        {savings.annualSavingsCents > 0
          ? `Saves ${formatCents(savings.annualSavingsCents)} in the first year · one card · one call`
          : "This win is not counted in dollars, so there is no fee."}
      </p>

      {quote && (
        <figure className="mt-6 flex gap-3 border-t border-ink/15 pt-5">
          <Quote className="mt-0.5 size-5 shrink-0 opacity-60" aria-hidden />
          <div>
            <blockquote className="font-display text-xl leading-snug sm:text-2xl">{quote}</blockquote>
            <figcaption className="mt-1.5 text-sm opacity-70">
              The bank&apos;s own words on the call. Code checked every number against them.
            </figcaption>
          </div>
        </figure>
      )}
    </motion.section>
  );
}
