"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Phone } from "lucide-react";
import { formatApr, formatDate } from "@/lib/format";
import { formatDollars, formatShort } from "@/lib/money";
import type { CardAccount, IsoDate } from "@/lib/types";
import { cn } from "@/lib/utils";
import { goalLabel } from "@/components/call/ask";
import { callHref } from "@/components/call/resolve-call";
import { callDate } from "@/components/dashboard/progress";
import { Stagger, StaggerItem } from "@/components/motion/reveal";
import { GrowBar } from "@/components/plan/animated";
import { CountUp } from "@/components/plan/count-up";
import { caption, h4, Panel, PanelHeader, PanelLink, Pill } from "@/components/site/app-ui";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/primitives";
import { dueLabel } from "@/components/win/next-up";
import { callResult, modeLabel, type Overview } from "./overview-model";

/** The card surfaces of the overview: graphite, the blue gradient, white and a pale blue wash. */
export const SURFACE = {
  dark: "bg-[linear-gradient(135deg,#2b3446_0%,#0b1220_72%)]",
  blue: "bg-[linear-gradient(150deg,#2448f0_0%,#2f6bff_55%,#8db6ff_100%)]",
  white: "bg-white",
  pale: "bg-[linear-gradient(135deg,#c4ddf6_0%,#e4effb_50%,#cfe0ff_100%)]",
} as const;

/** "Sample data", in a light version for white and grey grounds and a dark one for the graphite and blue cards. */
export function SampleTag({ tone = "light", className }: { tone?: "light" | "dark" | "blue"; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs leading-4 font-medium whitespace-nowrap",
        tone === "light" && "border-leak/30 bg-hg-blue-soft text-hg-blue",
        tone === "dark" && "border-white/15 bg-white/8 text-[#a9c6ff]",
        tone === "blue" && "border-white/15 bg-white/8 text-white",
        className,
      )}
    >
      <span aria-hidden className={cn("size-1.5 rounded-full", tone === "light" ? "bg-hg-blue" : "bg-white/16")} />
      Sample data
    </span>
  );
}

/** One figure in the KPI row: what the debt costs on graphite, the money kept on blue, the rest on white and pale blue. */
export function Kpi({
  label,
  children,
  note,
  tone = "white",
  art,
}: {
  label: string;
  children: React.ReactNode;
  note: React.ReactNode;
  tone?: keyof typeof SURFACE;
  /** A 3D object in the top right corner, behind the words. Decorative. */
  art?: React.ReactNode;
}) {
  const onDark = tone === "dark" || tone === "blue";
  return (
    <div
      className={cn(
        "relative flex h-full min-h-[143px] flex-col overflow-hidden rounded-[24px] p-5 transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5",
        SURFACE[tone],
        tone === "blue"
          ? "shadow-[0_18px_40px_-24px_rgb(47_107_255/0.9)]"
          : "shadow-[0_1px_2px_rgb(11_18_32/0.03)] hover:shadow-[0_16px_36px_-24px_rgb(11_18_32/0.3)]",
      )}
    >
      {art}
      <p className={cn(caption, "relative", onDark ? "text-white/70" : "text-hg-muted")}>{label}</p>
      <div className={cn("tabular relative mt-2 text-[30px] leading-[1.1] font-semibold tracking-[-0.035em]", onDark ? "text-white" : "text-hg-ink")}>
        {children}
      </div>
      <div className={cn("relative mt-auto pt-2 text-[13px] leading-[18px] font-medium", onDark ? "text-white/70" : "text-hg-muted")}>{note}</div>
    </div>
  );
}

/** The four numbers on top: what the debt costs now, what was saved, the calls won, what is left to win. */
export function KpiRow({ overview }: { overview: Overview }) {
  const lowered = overview.annualInterestCents < overview.annualInterestBeforeCents;
  return (
    <Stagger onMount gap={0.07} className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <StaggerItem className="h-full">
        <Kpi
          label="Interest you pay a year, now"
          tone="dark"
          art={
            <Image
              src="/app/3d/flame-3d.png"
              alt=""
              width={96}
              height={119}
              sizes="96px"
              className="pointer-events-none absolute -top-[7px] -right-1.5 h-[119px] w-24 select-none"
            />
          }
          note={lowered ? `Down from ${formatDollars(overview.annualInterestBeforeCents)} before your wins.` : "If the balance stays where it is."}
        >
          <CountUp value={overview.annualInterestCents} format="dollars" />
        </Kpi>
      </StaggerItem>
      <StaggerItem className="h-full">
        <Kpi
          label="Saved so far"
          tone="blue"
          note={
            overview.wins > 0
              ? `First-year savings from ${overview.wins} confirmed ${overview.wins === 1 ? "win" : "wins"}.`
              : "Shows up here once a bank says yes."
          }
        >
          <CountUp value={overview.savedCents} format="dollars" delay={0.1} />
        </Kpi>
      </StaggerItem>
      <StaggerItem className="h-full">
        <Kpi
          label="Calls won"
          note={
            <>
              <GrowBar percent={overview.callsWonPct} className="mb-2 h-1.5 bg-hg-surface" delay={0.3} />
              Practice calls: you play the bank.
            </>
          }
        >
          {overview.callsWon} <span className="text-hg-muted">of {overview.callsInPlan}</span>
        </Kpi>
      </StaggerItem>
      <StaggerItem className="h-full">
        <Kpi label="Still to win" tone="pale" note="A year, if the calls left go as they usually do.">
          <CountUp value={overview.openValueCents} format="dollars" delay={0.2} />
        </Kpi>
      </StaggerItem>
    </Stagger>
  );
}

function CardRowView({ row }: { row: Overview["cards"][number] }) {
  const { card } = row;
  return (
    <Link
      href="/cards"
      className={cn(
        SURFACE.dark,
        "group flex flex-col gap-2 rounded-[20px] p-3.5 transition-[transform,box-shadow] duration-200 hover:-translate-y-px hover:shadow-[0_14px_30px_-18px_rgb(11_18_32/0.7)]",
      )}
    >
      <span className="flex items-center justify-between gap-2">
        <span className={cn(caption, "min-w-0 truncate text-white")}>
          {card.issuerName || "Card"} · {formatDollars(card.balanceCents)}
        </span>
        <span className="flex shrink-0 gap-1">
          {row.won && <Pill className="px-2.5">Won</Pill>}
          {row.nextCall && <Pill className="bg-white/8 px-2.5 text-white">Next call</Pill>}
        </span>
      </span>
      <span className={cn(caption, "flex flex-wrap items-center gap-x-2 gap-y-1 text-white/70")}>
        <span>APR</span>
        {row.aprAfterBps !== null ? (
          <>
            <span className="line-through">{formatApr(row.aprBeforeBps)}</span>
            <ArrowRight className="size-3" aria-label="to" />
            <span className={cn(h4, "text-[#a9c6ff]")}>{formatApr(row.aprAfterBps)}</span>
          </>
        ) : (
          <span className={cn(h4, "text-white")}>{formatApr(card.purchaseAprBps)}</span>
        )}
        {card.annualFeeCents > 0 && <span>· {formatShort(card.annualFeeCents)} fee</span>}
      </span>
      {row.missedPayment && (
        <span className="flex flex-wrap gap-1.5">
          {row.missedPayment && <Badge tone="leak">Missed payment</Badge>}
        </span>
      )}
    </Link>
  );
}

/** "Your cards" with Won / Next call pills, then "Saved so far" growing toward the year's goal. */
export function YourCards({ overview }: { overview: Overview }) {
  return (
    <Panel aria-labelledby="your-cards" className="flex h-full flex-col gap-3 rounded-[28px]">
      <PanelHeader id="your-cards" title="Your cards" right={<PanelLink href="/cards">All</PanelLink>} />
      <Stagger onMount gap={0.06} delay={0.2} as="ul" className="flex flex-col gap-2">
        {overview.cards.map((row) => (
          <StaggerItem as="li" key={row.card.id}>
            <CardRowView row={row} />
          </StaggerItem>
        ))}
      </Stagger>
      <div className="min-h-2 flex-1" />
      <div className="flex flex-col gap-1.5">
        <span className={cn(caption, "text-hg-muted")}>Saved so far</span>
        <span className="tabular text-[28px] leading-8 font-semibold tracking-[-0.02em] text-hg-blue">
          <CountUp value={overview.savedCents} format="dollars" delay={0.2} />
        </span>
        <GrowBar percent={overview.savedPct} className="h-2 rounded-[4px] bg-hg-surface" fillClassName="rounded-[4px]" delay={0.4} />
        <span className={cn(caption, "text-hg-muted")}>
          {overview.goalCents > 0 ? `Goal ${formatDollars(overview.goalCents)} this year` : "No money left to ask for on these cards."}
        </span>
      </div>
    </Panel>
  );
}

/** The next few steps, soonest first. The full list, with the calendar file, is on Savings. */
export function NextStepsPanel({ overview, today }: { overview: Overview; today: IsoDate }) {
  return (
    <Panel aria-labelledby="overview-steps" className="flex flex-col gap-4 rounded-[28px]">
      <PanelHeader
        id="overview-steps"
        title="Next steps"
        sub="Each one has a date."
        right={overview.stepCount > overview.steps.length ? <PanelLink href="/savings#next-steps">All {overview.stepCount}</PanelLink> : null}
      />
      {overview.steps.length === 0 ? (
        <p className="rounded-[14px] bg-hg-surface p-4 text-sm font-medium text-hg-muted">Nothing is waiting. Every step in your plan has a win.</p>
      ) : (
        <Stagger as="ol" gap={0.06} className="flex flex-col gap-2">
          {overview.steps.map((step) => {
            const due = step.dueOn <= today;
            return (
              <StaggerItem as="li" key={step.id} className="flex items-start gap-3 rounded-[14px] bg-hg-surface p-3.5">
                <Pill tone={due ? "blue" : "white"} className="tabular mt-0.5 px-2.5">
                  {dueLabel(step.dueOn, today)}
                </Pill>
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-5 font-semibold tracking-[-0.01em] text-hg-ink">{step.title}</p>
                  <p className="mt-0.5 line-clamp-2 text-[13px] leading-[18px] font-medium text-hg-muted">{step.detail}</p>
                  {step.callStepId && due && (
                    <Link href={callHref(step.callStepId)} className={buttonVariants({ size: "sm", className: "mt-2.5" })}>
                      <Phone className="size-3.5" aria-hidden />
                      Start the call
                    </Link>
                  )}
                </div>
              </StaggerItem>
            );
          })}
        </Stagger>
      )}
    </Panel>
  );
}

/** The latest calls, newest first. Every call and its transcript are on Savings. */
export function RecentCalls({ overview, cards }: { overview: Overview; cards: CardAccount[] }) {
  const next = overview.nextCall;
  return (
    <Panel aria-labelledby="overview-calls" className="flex flex-col gap-4 rounded-[28px]">
      <PanelHeader
        id="overview-calls"
        title="Recent calls"
        sub="Practice calls: you play the bank."
        right={overview.recent.length > 0 ? <PanelLink href="/savings#calls">All calls</PanelLink> : null}
      />
      {overview.recent.length === 0 ? (
        <div className="flex flex-col items-start gap-3 rounded-[14px] bg-hg-surface p-4">
          <p className="text-sm font-medium text-hg-muted">No calls yet. Each one is kept here with its full transcript.</p>
          {next && (
            <Link href={callHref(next.id)} className={buttonVariants({ size: "sm" })}>
              <Phone className="size-3.5" aria-hidden />
              Start the first call
            </Link>
          )}
        </div>
      ) : (
        <Stagger as="ul" gap={0.06} className="flex flex-col gap-2">
          {overview.recent.map((call) => {
            const card = cards.find((candidate) => candidate.id === call.cardId);
            const result = callResult(call);
            const saved = call.savings?.annualSavingsCents ?? 0;
            const body = (
              <>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm leading-5 font-semibold tracking-[-0.01em] text-hg-ink">
                    {goalLabel(call.goal)} · {card?.issuerName || "A card no longer in your case"}
                  </span>
                  <span className={cn(caption, "block font-medium text-hg-muted")}>
                    {formatDate(callDate(call))} · {modeLabel(call.mode)} practice call
                  </span>
                </span>
                {result.win && saved > 0 && (
                  <span className="tabular text-[15px] font-semibold tracking-[-0.02em] text-hg-blue">{formatDollars(saved)}</span>
                )}
                {result.win ? (
                  <Pill tone="soft" className="px-2.5">
                    <CheckCircle2 className="size-3.5" aria-hidden />
                    {result.text}
                  </Pill>
                ) : (
                  <Badge tone="outline" className="bg-white">
                    {result.text}
                  </Badge>
                )}
              </>
            );
            return (
              <StaggerItem as="li" key={call.id}>
                {call.outcome ? (
                  <Link
                    href={`/win?call=${encodeURIComponent(call.id)}`}
                    className="flex items-center gap-3 rounded-[14px] bg-hg-surface p-3.5 transition-colors duration-200 hover:bg-hg-blue-soft/70"
                  >
                    {body}
                  </Link>
                ) : (
                  <div className="flex items-center gap-3 rounded-[14px] bg-hg-surface p-3.5">{body}</div>
                )}
              </StaggerItem>
            );
          })}
        </Stagger>
      )}
    </Panel>
  );
}
