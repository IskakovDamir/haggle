import { WIN_FEE_BPS } from "@/lib/engine";
import { formatPoints } from "@/lib/format";
import { formatCents } from "@/lib/money";
import { Card } from "@/components/ui/primitives";
import { Lift, Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { WonCheck } from "@/components/plan/animated";
import { CountUp } from "@/components/plan/count-up";
import type { Totals } from "./totals";

/** Paid versus saved. The two numbers side by side are the reason to come back. */
export function Scoreboard({ totals }: { totals: Totals }) {
  const hasWins = totals.wins > 0;
  return (
    <section aria-label="Paid versus saved">
      <Reveal y={16}>
        <h1 className="max-w-[22ch] text-[clamp(32px,5vw,56px)] leading-[1.08] font-semibold tracking-[-0.045em] text-hg-ink">
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
      </Reveal>

      <Stagger onMount delay={0.15} gap={0.1} className="mt-8 grid gap-4 sm:grid-cols-2">
        <StaggerItem className="h-full">
          <Lift className="h-full">
            <div className="hg-panel relative h-full overflow-hidden rounded-[32px] p-6 sm:p-8">
              <div aria-hidden className="pointer-events-none absolute -top-40 -right-32 size-[24rem] rounded-full bg-white/14 blur-3xl" />
              <div className="relative">
                <p className="flex items-center gap-2 text-sm font-semibold text-white/80">
                  {hasWins && <WonCheck className="size-5 bg-white text-hg-blue" delay={0.5} />}
                  Saved in the first year
                </p>
                <p className="tabular mt-3 text-[clamp(2.75rem,9vw,4.5rem)] leading-none font-semibold tracking-[-0.05em] text-white">
                  <CountUp value={totals.savedCents} format="cents" duration={1.1} delay={0.25} />
                </p>
                <p className="mt-4 text-sm leading-snug font-medium text-white/80">
                  {hasWins
                    ? `From ${totals.wins} confirmed ${totals.wins === 1 ? "win" : "wins"}. Only results found in the bank's own words count.`
                    : "A win shows up here once a call ends with a yes."}
                </p>
              </div>
            </div>
          </Lift>
        </StaggerItem>

        <StaggerItem className="h-full">
          <Lift className="h-full">
            <Card className="h-full p-6 sm:rounded-[32px] sm:p-8">
              <p className="text-sm font-semibold text-muted">Paid to Haggle</p>
              <p className="tabular mt-3 text-[clamp(2.75rem,9vw,4.5rem)] leading-none font-semibold tracking-[-0.05em] text-hg-ink">
                <CountUp value={totals.paidCents} format="cents" duration={1.1} delay={0.35} />
              </p>
              <p className="mt-4 text-sm leading-snug font-medium text-muted">
                {formatPoints(WIN_FEE_BPS)}% of each win, charged only after the bank says yes.
                {totals.unpaidFeeCents > 0 && ` ${formatCents(totals.unpaidFeeCents)} in fees is not paid yet.`}
              </p>
            </Card>
          </Lift>
        </StaggerItem>
      </Stagger>
    </section>
  );
}
