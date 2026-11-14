"use client";

import { useState } from "react";
import { Clock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, SampleBadge } from "@/components/ui/primitives";
import { isSampleCard } from "@/components/start/sample-cards";
import { formatApr, formatDate, formatDuration } from "@/lib/format";
import { formatCents, formatDollars, formatShort } from "@/lib/money";
import type { CardAccount, CardAnalysis, Payoff } from "@/lib/types";
import { cn } from "@/lib/utils";

/** "23 years 4 months and $14,900 in interest", or what to say when that sentence does not apply. */
function minimumOnlySentence(payoff: Payoff): string {
  if (payoff.months === 0) return "Nothing is owed on this card.";
  if (!payoff.paidOff) return `Still not paid off after ${formatDuration(payoff.months)}.`;
  return `${formatDuration(payoff.months)} and ${formatDollars(payoff.totalInterestCents)} in interest`;
}

function Figure({ label, value, tone }: { label: string; value: string; tone?: "leak" }) {
  return (
    <div>
      <dt className="text-xs font-semibold tracking-widest text-muted uppercase">{label}</dt>
      <dd className={cn("tabular mt-0.5 text-xl font-bold tracking-tight", tone === "leak" && "text-leak")}>{value}</dd>
    </div>
  );
}

function Utilization({ percent, limitCents }: { percent: number; limitCents: number }) {
  const tone = percent >= 70 ? "bg-alarm" : percent >= 30 ? "bg-leak" : "bg-green";
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="font-medium">Credit used</span>
        <span className="tabular text-muted">
          {percent}% of your {formatShort(limitCents)} limit
        </span>
      </div>
      <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-ink/10" aria-hidden>
        <div className={cn("h-full rounded-full", tone)} style={{ width: `${Math.min(100, percent)}%` }} />
      </div>
    </div>
  );
}

/** Asks once before removing: the card and its plan steps go at the same moment. */
function RemoveCard({ onRemove }: { onRemove: () => void }) {
  const [asking, setAsking] = useState(false);
  if (!asking) {
    return (
      <Button variant="ghost" size="sm" onClick={() => setAsking(true)}>
        <Trash2 className="size-4" aria-hidden />
        Remove
      </Button>
    );
  }
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-sm text-muted">Remove this card?</span>
      <Button variant="danger" size="sm" onClick={onRemove}>
        Remove
      </Button>
      <Button variant="outline" size="sm" onClick={() => setAsking(false)}>
        Keep
      </Button>
    </div>
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
    <Card className="p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-xl font-bold tracking-tight">{card.issuerName || "Card"}</h3>
            {isSampleCard(card) && <SampleBadge />}
          </div>
          <p className="text-sm text-muted">
            {card.cardName}
            {card.last4 && `, ending in ${card.last4}`}
          </p>
        </div>
        <RemoveCard onRemove={onRemove} />
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3">
        <Figure label="Balance" value={formatCents(card.balanceCents)} />
        <Figure label="APR" value={formatApr(card.purchaseAprBps)} />
        <Figure label="Interest a year" value={formatDollars(analysis.annualInterestCents)} tone="leak" />
      </dl>

      <div className="mt-5 rounded-xl border border-leak/25 bg-leak-soft p-4">
        <p className="text-xs font-semibold tracking-widest text-leak uppercase">Paying only the minimum</p>
        <p className="mt-1 text-xl leading-snug font-bold tracking-tight text-leak sm:text-2xl">
          {minimumOnlySentence(analysis.minimumOnly)}
        </p>
      </div>

      <div className="mt-5 space-y-4">
        {analysis.utilizationPct !== null && card.creditLimitCents !== null ? (
          <Utilization percent={analysis.utilizationPct} limitCents={card.creditLimitCents} />
        ) : (
          <p className="text-sm text-muted">Credit used: unknown, because the statement did not show a credit limit.</p>
        )}

        {card.promo && promoDays !== null && (
          <p className="flex items-start gap-2.5 rounded-xl border border-alarm/25 bg-alarm-soft p-4 text-sm text-alarm">
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
