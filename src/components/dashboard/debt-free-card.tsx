import Image from "next/image";
import { formatApr, formatDate, formatDuration } from "@/lib/format";
import { formatCents } from "@/lib/money";
import { Badge, Card } from "@/components/ui/primitives";
import type { CardAccount, IsoDate, Payoff } from "@/lib/types";
import { cn } from "@/lib/utils";
import { cardLabel } from "@/components/call/ask";
import { GrowBar } from "@/components/plan/animated";
import type { DebtFree } from "./debt-free";

/** One simulation: the date the debt ends, how long that is, and the interest paid on the way. */
function PayoffColumn({
  title,
  payoff,
  date,
  highlight = false,
  barPercent = null,
  art = false,
}: {
  title: string;
  payoff: Payoff;
  date: IsoDate | null;
  highlight?: boolean;
  /** How long this payoff runs next to the longer one, as the width of a bar. null shows no bar. */
  barPercent?: number | null;
  /** The lone column: a pale blue gradient with the 3D calendar on its right. */
  art?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative flex flex-col overflow-hidden p-4 sm:p-5",
        art
          ? "rounded-[28px] bg-[linear-gradient(135deg,#c4ddf6_0%,#e4effb_50%,#cfe0ff_100%)] pr-28 sm:rounded-[32px] sm:pr-36"
          : "rounded-[20px]",
        !art && (highlight ? "bg-hg-blue-soft" : "bg-hg-surface"),
      )}
    >
      {art && (
        <Image
          src="/app/3d/calendar-3d.png"
          alt=""
          aria-hidden
          width={188}
          height={183}
          className="pointer-events-none absolute -top-3.5 -right-3.5 h-auto w-[118px] max-w-none sm:w-[150px]"
        />
      )}
      <p className="relative text-[13px] leading-[18px] font-semibold text-muted">{title}</p>
      {date ? (
        <>
          <p
            className={cn(
              "tabular relative mt-1.5 text-[26px] leading-8 font-semibold tracking-[-0.035em] text-hg-ink",
              highlight && "text-hg-blue",
            )}
          >
            {formatDate(date)}
          </p>
          <p className="relative mt-1 text-sm font-medium text-muted">
            {formatDuration(payoff.months)} · {formatCents(payoff.totalInterestCents)} in interest
          </p>
        </>
      ) : (
        <p className="relative mt-1.5 font-semibold">Minimum payments never clear this balance.</p>
      )}
      {barPercent !== null && (
        <div className="mt-auto pt-4">
          <GrowBar
            percent={barPercent}
            delay={highlight ? 0.35 : 0.15}
            className="h-2 bg-white"
            fillClassName={highlight ? "bg-hg-blue" : "bg-ink/35"}
          />
        </div>
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

/**
 * Bar widths for the before and after columns: the longer payoff fills its bar, the shorter one
 * takes its share of that length. Only drawn when both simulations end, so both lengths are known.
 */
function barWidths(before: Payoff, after: Payoff | null): { before: number | null; after: number | null } {
  if (!after || !before.paidOff || !after.paidOff) return { before: null, after: null };
  const longest = Math.max(before.months, after.months, 1);
  return { before: (before.months / longest) * 100, after: (after.months / longest) * 100 };
}

/** The debt-free date for one card when only the minimum is paid: before the wins, and after them. */
export function DebtFreeCard({ card, debtFree }: { card: CardAccount; debtFree: DebtFree }) {
  const { before, after, steady } = debtFree;
  const bars = barWidths(before, after);
  return (
    <Card className="border-line p-5 shadow-none transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:shadow-[0_1px_2px_rgb(11_18_32/0.04),0_20px_40px_-20px_rgb(11_18_32/0.25)] sm:rounded-[28px] sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg font-semibold tracking-[-0.02em] text-hg-ink">{cardLabel(card)}</h3>
        {debtFree.aprAfterBps !== null ? (
          <Badge tone="lime">
            APR {formatApr(debtFree.aprBeforeBps)} to {formatApr(debtFree.aprAfterBps)}
          </Badge>
        ) : (
          <Badge tone="outline">APR {formatApr(debtFree.aprBeforeBps)}</Badge>
        )}
      </div>

      <div className={cn("mt-5 grid gap-3", after && "sm:grid-cols-2")}>
        <PayoffColumn
          title={after ? "Before the win" : "Debt-free by"}
          payoff={before}
          date={debtFree.beforeDate}
          barPercent={bars.before}
          art={!after}
        />
        {after && (
          <PayoffColumn title="After the win" payoff={after} date={debtFree.afterDate} highlight barPercent={bars.after} />
        )}
      </div>

      {after && before.paidOff && after.paidOff && (
        <p className="mt-4 font-semibold tracking-[-0.01em] text-hg-blue">{difference(before, after)}</p>
      )}

      {steady.date && steady.payoff.months < (after ?? before).months && (
        <p className="mt-3 text-sm leading-relaxed text-muted">
          The minimum shrinks as the balance falls, which is why it takes so long. Keep paying this month&apos;s{" "}
          {formatCents(steady.paymentCents)} every month and the debt ends by {formatDate(steady.date)}.
        </p>
      )}
    </Card>
  );
}
