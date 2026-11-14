import { formatApr, formatDate, formatDuration } from "@/lib/format";
import { formatCents } from "@/lib/money";
import { Badge, Card } from "@/components/ui/primitives";
import type { CardAccount, IsoDate, Payoff } from "@/lib/types";
import { cn } from "@/lib/utils";
import { cardLabel } from "@/components/call/ask";
import type { DebtFree } from "./debt-free";

/** One simulation: the date the debt ends, how long that is, and the interest paid on the way. */
function PayoffColumn({
  title,
  payoff,
  date,
  highlight = false,
}: {
  title: string;
  payoff: Payoff;
  date: IsoDate | null;
  highlight?: boolean;
}) {
  return (
    <div className={cn("rounded-2xl p-4", highlight ? "bg-green-soft" : "bg-paper")}>
      <p className="text-xs font-semibold tracking-widest text-muted uppercase">{title}</p>
      {date ? (
        <>
          <p className={cn("tabular mt-1 text-2xl font-extrabold", highlight && "text-green")}>{formatDate(date)}</p>
          <p className="mt-1 text-sm text-muted">
            {formatDuration(payoff.months)} · {formatCents(payoff.totalInterestCents)} in interest
          </p>
        </>
      ) : (
        <p className="mt-1 font-semibold">Minimum payments never clear this balance.</p>
      )}
    </div>
  );
}

/** One sentence on what the lower rate changed, in months and in dollars. */
function difference(before: Payoff, after: Payoff): string {
  const months = before.months - after.months;
  const interest = before.totalInterestCents - after.totalInterestCents;
  const sooner = months > 0 ? `${formatDuration(months)} sooner` : "The same date";
  return interest > 0 ? `${sooner}, and ${formatCents(interest)} less interest on the way.` : `${sooner}.`;
}

/** The debt-free date for one card when only the minimum is paid: before the wins, and after them. */
export function DebtFreeCard({ card, debtFree }: { card: CardAccount; debtFree: DebtFree }) {
  const { before, after, steady } = debtFree;
  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-extrabold">{cardLabel(card)}</h3>
        {debtFree.aprAfterBps !== null ? (
          <Badge tone="green">
            APR {formatApr(debtFree.aprBeforeBps)} to {formatApr(debtFree.aprAfterBps)}
          </Badge>
        ) : (
          <Badge tone="outline">APR {formatApr(debtFree.aprBeforeBps)}</Badge>
        )}
      </div>

      <div className={cn("mt-4 grid gap-3", after && "sm:grid-cols-2")}>
        <PayoffColumn title={after ? "Before the win" : "Debt-free by"} payoff={before} date={debtFree.beforeDate} />
        {after && <PayoffColumn title="After the win" payoff={after} date={debtFree.afterDate} highlight />}
      </div>

      {after && before.paidOff && after.paidOff && <p className="mt-3 font-semibold">{difference(before, after)}</p>}

      {steady.date && steady.payoff.months < (after ?? before).months && (
        <p className="mt-3 text-sm text-muted">
          The minimum shrinks as the balance falls, which is why it takes so long. Keep paying this month&apos;s{" "}
          {formatCents(steady.paymentCents)} every month and the debt ends by {formatDate(steady.date)}.
        </p>
      )}
    </Card>
  );
}
