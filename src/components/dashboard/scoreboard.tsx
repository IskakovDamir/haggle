import { WIN_FEE_BPS } from "@/lib/engine";
import { formatPoints } from "@/lib/format";
import { formatCents } from "@/lib/money";
import { Card } from "@/components/ui/primitives";
import type { Totals } from "./totals";

/** Paid versus saved. The two numbers side by side are the reason to come back. */
export function Scoreboard({ totals }: { totals: Totals }) {
  const hasWins = totals.wins > 0;
  return (
    <section aria-label="Paid versus saved">
      <h1 className="text-3xl leading-tight font-extrabold sm:text-5xl">
        {hasWins ? (
          <>
            Haggle cost you {formatCents(totals.paidCents)} and <em>saved you {formatCents(totals.savedCents)}</em>
          </>
        ) : (
          <>
            No wins yet. <em>The first call</em> changes that
          </>
        )}
      </h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-3xl bg-ink p-6 text-paper">
          <p className="text-sm text-paper/70">Saved in the first year</p>
          <p className="tabular mt-1 text-[clamp(2.25rem,8vw,3.75rem)] leading-none font-extrabold tracking-tight text-lime">
            {formatCents(totals.savedCents)}
          </p>
          <p className="mt-3 text-sm text-paper/70">
            {hasWins
              ? `From ${totals.wins} confirmed ${totals.wins === 1 ? "win" : "wins"}. Only results found in the bank's own words count.`
              : "A win shows up here once a call ends with a yes."}
          </p>
        </div>

        <Card className="rounded-3xl p-6">
          <p className="text-sm text-muted">Paid to Haggle</p>
          <p className="tabular mt-1 text-[clamp(2.25rem,8vw,3.75rem)] leading-none font-extrabold tracking-tight">
            {formatCents(totals.paidCents)}
          </p>
          <p className="mt-3 text-sm text-muted">
            {formatPoints(WIN_FEE_BPS)}% of each win, charged only after the bank says yes.
            {totals.unpaidFeeCents > 0 && ` ${formatCents(totals.unpaidFeeCents)} in fees is not paid yet.`}
          </p>
        </Card>
      </div>
    </section>
  );
}
