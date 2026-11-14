import Link from "next/link";
import { Phone } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { SampleBadge } from "@/components/ui/primitives";
import { formatDollars } from "@/lib/money";
import type { Cents } from "@/lib/types";
import type { Analysis, PlanStep } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CountUpDollars } from "./count-up";

function Stat({ label, value, note, tone }: { label: string; value: string; note: string; tone?: "green" }) {
  return (
    <div className="rounded-2xl border border-line bg-card p-5">
      <p className="text-xs font-semibold tracking-widest text-muted uppercase">{label}</p>
      <p className={cn("tabular mt-1.5 text-3xl leading-[1.1] font-extrabold tracking-tight", tone === "green" && "text-green")}>
        {value}
      </p>
      <p className="mt-1.5 text-sm leading-snug text-muted">{note}</p>
    </div>
  );
}

/** The number the whole screen is about, the three totals under it, and the one primary action. */
export function Headline({
  name,
  totals,
  cardCount,
  hasSampleCard,
  firstCall,
  wins,
}: {
  name: string;
  totals: Analysis["totals"];
  cardCount: number;
  hasSampleCard: boolean;
  /** The first step in the plan that needs a call, if there is one. */
  firstCall: PlanStep | null;
  /** Calls already won, already reflected in the totals above. */
  wins: { count: number; savedCents: Cents };
}) {
  const burning = totals.annualInterestCents > 0;

  return (
    <header>
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-xs font-bold tracking-widest text-green uppercase">Your plan</p>
        {hasSampleCard && <SampleBadge />}
      </div>

      {burning ? (
        <h1 className="mt-3 text-2xl leading-tight font-extrabold sm:text-3xl">
          {wins.count > 0 ? (name ? `${name}, after your wins you are still burning` : "After your wins you are still burning") : name ? `${name}, you are burning` : "You are burning"}
          <span className="tabular my-1 block w-fit bg-[linear-gradient(transparent_62%,var(--lime)_62%)] px-1 text-[clamp(4rem,17vw,9rem)] leading-none tracking-tighter">
            <CountUpDollars cents={totals.annualInterestCents} />
          </span>
          <em>a year</em> in interest
        </h1>
      ) : (
        <h1 className="mt-3 max-w-[20ch] text-3xl leading-[1.1] font-extrabold sm:text-[2.75rem]">
          {name ? `${name}, these cards` : "These cards"} are <em>not charging interest</em> right now
        </h1>
      )}

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <Stat
          label="Card debt"
          value={formatDollars(totals.balanceCents)}
          note={cardCount === 1 ? "on one card" : `across ${cardCount} cards`}
        />
        <Stat
          label="Credit used"
          value={totals.utilizationPct === null ? "Unknown" : `${totals.utilizationPct}%`}
          note={totals.utilizationPct === null ? "Add each card's credit limit to see it." : "of your total credit limit"}
        />
        <Stat
          label="Calls could win"
          value={formatDollars(totals.potentialAnnualCents)}
          note="in the first year if each call wins, with APR cuts at the average"
          tone="green"
        />
      </div>

      {wins.count > 0 && (
        <p className="mt-6 text-[15px] font-medium text-green">
          Already won: {formatDollars(wins.savedCents)} a year from {wins.count === 1 ? "one call" : `${wins.count} calls`}.{" "}
          <Link href="/dashboard" className="underline underline-offset-2">
            See your wins
          </Link>
        </p>
      )}

      {firstCall && (
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link href={`/call?step=${encodeURIComponent(firstCall.id)}`} className={buttonVariants({ size: "lg" })}>
            <Phone className="size-4" aria-hidden />
            {wins.count > 0 ? "Start the next call" : "Start the first call"}
          </Link>
          <p className="text-sm text-muted">{firstCall.lever.title}. A practice call: you play the bank.</p>
        </div>
      )}
    </header>
  );
}
