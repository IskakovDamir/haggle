"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Clock, Trash2 } from "lucide-react";
import { EASE } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { Card, SampleBadge } from "@/components/ui/primitives";
import { isSampleCard } from "@/components/start/sample-cards";
import { formatApr, formatDate, formatDuration } from "@/lib/format";
import { formatCents, formatDollars, formatShort } from "@/lib/money";
import type { CardAccount, CardAnalysis, Payoff } from "@/lib/types";
import { cn } from "@/lib/utils";
import { GrowBar } from "./animated";
import { INK_PANEL, SAMPLE_BADGE_CLASS } from "./surfaces";

/** "23 years 4 months and $14,900 in interest", or what to say when that sentence does not apply. */
function minimumOnlySentence(payoff: Payoff): string {
  if (payoff.months === 0) return "Nothing is owed on this card.";
  if (!payoff.paidOff) return `Still not paid off after ${formatDuration(payoff.months)}.`;
  return `${formatDuration(payoff.months)} and ${formatDollars(payoff.totalInterestCents)} in interest`;
}

function Figure({ label, value, tone }: { label: string; value: string; tone?: "blue" }) {
  return (
    <div>
      <dt className="text-[13px] leading-[18px] font-semibold text-muted">{label}</dt>
      <dd
        className={cn(
          "tabular mt-1 text-[clamp(22px,2.4vw,28px)] leading-tight font-semibold tracking-[-0.035em] text-hg-ink",
          tone === "blue" && "text-hg-blue",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function Utilization({ percent, limitCents }: { percent: number; limitCents: number }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="font-semibold text-hg-ink">Credit used</span>
        <span className="tabular font-medium text-muted">
          {percent}% of your {formatShort(limitCents)} limit
        </span>
      </div>
      <GrowBar percent={percent} className="mt-2.5 h-3 bg-hg-surface" />
    </div>
  );
}

/** Asks once before removing: the card and its plan steps go at the same moment. */
function RemoveCard({ onRemove }: { onRemove: () => void }) {
  const [asking, setAsking] = useState(false);
  return (
    <AnimatePresence mode="wait" initial={false}>
      {asking ? (
        <motion.div
          key="asking"
          className="flex items-center gap-1.5"
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 8 }}
          transition={{ duration: 0.25, ease: EASE }}
        >
          <span className="text-sm text-muted">Remove this card?</span>
          <Button variant="danger" size="sm" onClick={onRemove}>
            Remove
          </Button>
          <Button variant="outline" size="sm" onClick={() => setAsking(false)}>
            Keep
          </Button>
        </motion.div>
      ) : (
        <motion.div
          key="idle"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: EASE }}
        >
          <Button variant="ghost" size="sm" onClick={() => setAsking(true)}>
            <Trash2 className="size-4" aria-hidden />
            Remove
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** One card: what it costs, the minimum-payment trap, how much of the limit is used, a promo countdown. */
export function CardPanel({
  card,
  analysis,
  onRemove,
}: {
  card: CardAccount;
  analysis: CardAnalysis;
  onRemove: () => void;
}) {
  const promoDays = analysis.promoEndsInDays;

  return (
    <Card className="p-5 transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:shadow-[0_1px_2px_rgb(11_18_32/0.04),0_20px_40px_-20px_rgb(11_18_32/0.25)] sm:rounded-[28px] sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-[22px] leading-7 font-semibold tracking-[-0.025em] text-hg-ink">{card.issuerName || "Card"}</h3>
            {isSampleCard(card) && <SampleBadge className={SAMPLE_BADGE_CLASS} />}
          </div>
          <p className="mt-0.5 text-sm font-medium text-muted">
            {card.cardName}
            {card.last4 && `, ending in ${card.last4}`}
          </p>
        </div>
        <RemoveCard onRemove={onRemove} />
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3">
        <Figure label="Balance" value={formatCents(card.balanceCents)} />
        <Figure label="APR" value={formatApr(card.purchaseAprBps)} />
        <Figure label="Interest a year" value={formatDollars(analysis.annualInterestCents)} tone="blue" />
      </dl>

      <div className="mt-6 rounded-[24px] px-5 py-4 text-[#a9c6ff] sm:rounded-[32px] sm:py-[18px]" style={INK_PANEL}>
        <p className="text-[13px] leading-[18px] font-semibold">Paying only the minimum</p>
        <p className="mt-1.5 text-xl leading-snug font-semibold tracking-[-0.025em] sm:text-[26px] sm:leading-8">
          {minimumOnlySentence(analysis.minimumOnly)}
        </p>
      </div>

      <div className="mt-6 space-y-4">
        {analysis.utilizationPct !== null && card.creditLimitCents !== null ? (
          <Utilization percent={analysis.utilizationPct} limitCents={card.creditLimitCents} />
        ) : (
          <p className="text-sm text-muted">Credit used: unknown, because the statement did not show a credit limit.</p>
        )}

        {card.promo && promoDays !== null && (
          <p className="flex items-start gap-2.5 rounded-[18px] border border-alarm/20 bg-alarm-soft p-4 text-sm text-alarm">
            <Clock className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>
              <strong className="tabular">
                The {formatApr(card.promo.aprBps)} promo rate ends {promoDays === 0 ? "today" : promoDays === 1 ? "in 1 day" : `in ${promoDays} days`}
              </strong>
              , on {formatDate(card.promo.endsOn)}. After that the rate is {formatApr(card.purchaseAprBps)}.
            </span>
          </p>
        )}
      </div>
    </Card>
  );
}
