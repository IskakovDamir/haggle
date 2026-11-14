import { WIN_FEE_BPS } from "@/lib/engine";
import { formatPoints } from "@/lib/format";
import { formatCents } from "@/lib/money";
import { Card } from "@/components/ui/primitives";
import type { Savings } from "@/lib/types";
import { cn } from "@/lib/utils";

function Row({ label, cents, className }: { label: string; cents: number; className?: string }) {
  return (
    <div className={cn("flex items-baseline justify-between gap-4", className)}>
      <dt>{label}</dt>
      <dd className="tabular shrink-0 font-semibold">{formatCents(cents)}</dd>
    </div>
  );
}

/** First-year savings line by line, Haggle's fee, and what the visitor keeps. */
export function Receipt({ savings }: { savings: Savings }) {
  return (
    <Card className="p-5 sm:p-6">
      <h2 className="text-lg font-extrabold">First-year savings</h2>
      <dl className="mt-4 flex flex-col gap-2.5 text-[15px]">
        {savings.lines.map((line) => (
          <Row key={line.label} label={line.label} cents={line.cents} />
        ))}
        <Row label="Total saved in the first year" cents={savings.annualSavingsCents} className="border-t border-line pt-3 font-semibold" />
        <Row label={`Haggle's fee (${formatPoints(WIN_FEE_BPS)}%)`} cents={savings.feeCents} className="text-muted" />
        <Row
          label="You keep"
          cents={savings.annualSavingsCents - savings.feeCents}
          className="border-t border-line pt-3 text-lg font-extrabold text-green"
        />
      </dl>
      <p className="mt-4 text-sm text-muted">Savings assume the balance stays where it is today for 12 months.</p>
    </Card>
  );
}
