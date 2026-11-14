"use client";

import { motion, type Variants } from "framer-motion";
import { EASE } from "@/components/motion/reveal";
import { WIN_FEE_BPS } from "@/lib/engine";
import { formatPoints } from "@/lib/format";
import { formatCents } from "@/lib/money";
import { Card } from "@/components/ui/primitives";
import type { Savings } from "@/lib/types";
import { cn } from "@/lib/utils";
import { BEAT, CountUpCents } from "./win-motion";

const list: Variants = {
  hidden: {},
  shown: { transition: { staggerChildren: 0.1, delayChildren: BEAT.receipt + 0.15 } },
};

const line: Variants = {
  hidden: { opacity: 0, x: -10 },
  shown: { opacity: 1, x: 0, transition: { duration: 0.45, ease: EASE } },
};

function Row({
  label,
  cents,
  className,
  count = false,
}: {
  label: string;
  cents: number;
  className?: string;
  /** Count up to the figure as the row lands. */
  count?: boolean;
}) {
  return (
    <motion.div variants={line} className={cn("flex items-baseline justify-between gap-4", className)}>
      <dt>{label}</dt>
      <dd className="tabular shrink-0 font-semibold">
        {count ? <CountUpCents cents={cents} delay={BEAT.pay} duration={0.7} /> : formatCents(cents)}
      </dd>
    </motion.div>
  );
}

/** First-year savings line by line, Haggle's fee, and what the visitor keeps. */
export function Receipt({ savings }: { savings: Savings }) {
  return (
    <Card className="rounded-[28px] p-6 sm:p-7">
      <h2 className="text-[20px] leading-tight font-semibold tracking-[-0.03em] text-hg-ink">First-year savings</h2>
      <motion.dl variants={list} initial="hidden" animate="shown" className="mt-5 flex flex-col gap-2.5 text-[15px]">
        {savings.lines.map((item) => (
          <Row key={item.label} label={item.label} cents={item.cents} />
        ))}
        <Row
          label="Total saved in the first year"
          cents={savings.annualSavingsCents}
          className="border-t border-line pt-3 font-semibold"
        />
        <Row label={`Haggle's fee (${formatPoints(WIN_FEE_BPS)}%)`} cents={savings.feeCents} className="text-muted" />
        <Row
          label="You keep"
          cents={savings.annualSavingsCents - savings.feeCents}
          count
          className="mt-1 rounded-2xl bg-hg-blue-soft px-4 py-3 text-lg font-semibold tracking-[-0.01em] text-green"
        />
      </motion.dl>
      <p className="mt-4 text-sm text-muted">Savings assume the balance stays where it is today for 12 months.</p>
    </Card>
  );
}
