import Link from "next/link";
import { ArrowRight, Phone } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { SampleBadge } from "@/components/ui/primitives";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { formatDollars } from "@/lib/money";
import type { Cents } from "@/lib/types";
import type { Analysis, PlanStep } from "@/lib/types";
import { cn } from "@/lib/utils";
import { GrowBar, WonCheck } from "./animated";
import { CountUp } from "./count-up";

/** The pale blue of the landing's "Problem" panel, used when the cards are not charging interest. */
const CALM_PANEL = { backgroundImage: "linear-gradient(156.89deg, #c4ddf6 14.286%, #e4effb 50%, #cfe0ff 85.714%)" };
/** The dark ink stat card from the landing's stats row. */
const INK_CARD = { backgroundImage: "linear-gradient(133.83deg, #1e2740 14.286%, #0b1220 85.714%)" };

function Stat({
  label,
  value,
  note,
  dark = false,
  children,
}: {
  label: string;
  value: React.ReactNode;
  note: string;
  dark?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex h-full flex-col rounded-[24px] border p-5 sm:p-6",
        dark ? "border-white/15 text-white" : "border-white/90 bg-white/95 text-hg-ink",
      )}
      style={dark ? INK_CARD : undefined}
    >
      <p className={cn("text-[13px] leading-[18px] font-semibold", dark ? "text-white/60" : "text-muted")}>{label}</p>
      <p
        className={cn(
          "tabular mt-3 text-[clamp(30px,3.6vw,40px)] leading-[1.05] font-semibold tracking-[-0.04em]",
          dark && "text-[#a9c6ff]",
        )}
      >
        {value}
      </p>
      {children}
      <p className={cn("mt-2 text-sm leading-snug font-medium", dark ? "text-white/65" : "text-muted")}>{note}</p>
    </div>
  );
}

/** Soft white light in the corners of the hero panel, as on the landing's blue cards. Decorative. */
function Glow() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <div className="absolute -top-48 -right-40 size-[28rem] rounded-full bg-white/14 blur-3xl" />
      <div className="absolute -bottom-56 -left-24 size-[26rem] rounded-full bg-[#1a3fb0]/50 blur-3xl" />
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
        <p className="inline-flex items-center rounded-full bg-hg-blue-soft px-3 py-1 text-[13px] font-semibold text-hg-blue">
          Your plan
        </p>
        {hasSampleCard && <SampleBadge />}
      </div>

      <Reveal
        y={16}
        className={cn("relative mt-4 overflow-hidden rounded-[32px] p-5 sm:rounded-[40px] sm:p-8 lg:p-10", burning && "hg-panel")}
      >
        {burning ? <Glow /> : <div aria-hidden className="absolute inset-0" style={CALM_PANEL} />}

        <div className="relative">
          {burning ? (
            <h1 className="text-[clamp(24px,2.6vw,30px)] leading-tight font-semibold text-white">
              {wins.count > 0 ? (name ? `${name}, after your wins you are still burning` : "After your wins you are still burning") : name ? `${name}, you are burning` : "You are burning"}
              <span className="tabular my-2 block w-fit text-[clamp(4rem,15vw,9rem)] leading-[0.95] tracking-[-0.055em]">
                <CountUp value={totals.annualInterestCents} format="dollars" duration={1.1} delay={0.15} />
              </span>
              <em className="text-white/80!">a year</em> in interest
            </h1>
          ) : (
            <h1 className="max-w-[20ch] text-[clamp(30px,4.5vw,48px)] leading-[1.1] font-semibold text-hg-ink">
              {name ? `${name}, these cards` : "These cards"} are <em>not charging interest</em> right now
            </h1>
          )}

          <Stagger onMount delay={0.35} className="mt-8 grid gap-3 sm:grid-cols-3 sm:gap-4">
            <StaggerItem>
              <Stat
                label="Card debt"
                value={<CountUp value={totals.balanceCents} format="dollars" delay={0.4} />}
                note={cardCount === 1 ? "on one card" : `across ${cardCount} cards`}
              />
            </StaggerItem>
            <StaggerItem>
              <Stat
                label="Credit used"
                value={totals.utilizationPct === null ? "Unknown" : <CountUp value={totals.utilizationPct} format="percent" delay={0.45} />}
                note={totals.utilizationPct === null ? "Add each card's credit limit to see it." : "of your total credit limit"}
              >
                {totals.utilizationPct !== null && (
                  <GrowBar
                    percent={totals.utilizationPct}
                    delay={0.5}
                    className="mt-3"
                    fillClassName={totals.utilizationPct >= 70 ? "bg-alarm" : totals.utilizationPct >= 30 ? "bg-leak" : undefined}
                  />
                )}
              </Stat>
            </StaggerItem>
            <StaggerItem>
              <Stat
                label="Calls could win"
                value={<CountUp value={totals.potentialAnnualCents} format="dollars" delay={0.5} />}
                note="in the first year if each call wins, with APR cuts at the average"
                dark
              />
            </StaggerItem>
          </Stagger>
        </div>
      </Reveal>

      {wins.count > 0 && (
        <Reveal y={12} delay={0.2} className="mt-5">
          <p className="inline-flex flex-wrap items-center gap-x-2.5 gap-y-1 rounded-[20px] bg-hg-blue-soft py-2.5 pr-4 pl-2.5 text-[15px] font-medium text-hg-blue">
            <WonCheck className="size-6" delay={0.35} />
            <span>
              Already won: {formatDollars(wins.savedCents)} a year from {wins.count === 1 ? "one call" : `${wins.count} calls`}.{" "}
              <Link href="/dashboard" className="font-semibold underline underline-offset-2">
                See your wins
              </Link>
            </span>
          </p>
        </Reveal>
      )}

      {firstCall && (
        <Reveal y={12} delay={0.3} className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link href={`/call?step=${encodeURIComponent(firstCall.id)}`} className={cn(buttonVariants({ size: "lg" }), "group")}>
            <Phone className="size-4" aria-hidden />
            {wins.count > 0 ? "Start the next call" : "Start the first call"}
            <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
          </Link>
          <p className="text-sm font-medium text-muted">{firstCall.lever.title}. A practice call: you play the bank.</p>
        </Reveal>
      )}
    </header>
  );
}
