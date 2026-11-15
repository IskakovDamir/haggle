"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import { ArrowRight, CheckCircle2, Circle, Phone, Plus, RotateCcw } from "lucide-react";
import { callHref } from "@/components/call/resolve-call";
import { EASE, Stagger, StaggerItem } from "@/components/motion/reveal";
import { cardsAfterWins } from "@/components/plan/apply-wins";
import { CountUpDollars } from "@/components/plan/count-up";
import { NumbersBoundary } from "@/components/plan/numbers-boundary";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/primitives";
import { analyze } from "@/lib/engine";
import { formatDate, todayIso } from "@/lib/format";
import { formatDollars } from "@/lib/money";
import { useCaseFile } from "@/lib/store";
import type { CaseFile } from "@/lib/types";
import { cn } from "@/lib/utils";
import { buildCallList, type CallItem } from "./call-list-model";

/** A row rising into its place in the list. */
const rowRise: Variants = {
  hidden: { opacity: 0, y: 12 },
  shown: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } },
};

const STAT_LABEL = "text-[13px] leading-[18px] font-semibold tracking-[-0.002em]";
const STAT_VALUE = "tabular mt-2.5 text-[34px] leading-[1.1] font-semibold tracking-[-0.035em]";
/** A see-through stat box on the blue panel. */
const GLASS = "h-full rounded-[24px] border border-white/16 bg-white/10 p-6";
/** The blue panel behind the calls header and the empty state. */
const BLUE_GRADIENT = "bg-[linear-gradient(120deg,#2448f0_0%,#2f6bff_55%,#8db6ff_100%)]";
/** The dark strip on top of each bank's list. */
const INK_GRADIENT = "bg-[linear-gradient(135deg,#2b3446_0%,#0b1220_72%)]";
/** A white button on a coloured panel. */
const ON_PANEL_BUTTON = "bg-white text-hg-ink shadow-none hover:bg-white hover:shadow-none hover:brightness-95";

function StatusLine({ item }: { item: CallItem }) {
  const { status } = item;
  if (status.kind === "won") {
    return (
      <Link
        href={`/win?call=${encodeURIComponent(status.callId)}`}
        className="text-sm font-semibold text-hg-blue underline-offset-2 hover:underline"
      >
        Won · saves {formatDollars(status.savedCents)} a year
      </Link>
    );
  }
  if (status.kind === "declined") {
    return <p className="text-sm font-medium text-muted">The bank said no. Ask again on {formatDate(status.askAgainOn)}.</p>;
  }
  if (status.kind === "unclear") return <p className="text-sm font-medium text-muted">The last call had no clear result. Try again.</p>;
  const worth = item.step.lever.potentialAnnualCents;
  return (
    <p className="text-sm font-medium text-muted">{worth > 0 ? `Worth about ${formatDollars(worth)} a year` : "Helps your credit score"}</p>
  );
}

function Row({ item }: { item: CallItem }) {
  const done = item.status.kind === "won" || item.status.kind === "declined";
  return (
    <motion.li
      variants={rowRise}
      whileHover={{ y: -2, transition: { duration: 0.25, ease: EASE } }}
      className="flex items-center gap-4 rounded-[20px] p-4 transition-[background-color,box-shadow] duration-300 hover:bg-white hover:shadow-[0_14px_32px_-20px_rgb(47_107_255/0.45)] sm:p-5"
    >
      {done ? (
        <CheckCircle2 className={cn("size-6 shrink-0", item.status.kind === "won" ? "text-hg-blue" : "text-muted")} aria-hidden />
      ) : (
        <Circle className="size-6 shrink-0 text-hg-blue-tint" aria-hidden />
      )}
      <div className="min-w-0 flex-1">
        <p className={cn("font-semibold tracking-[-0.01em]", done ? "text-muted line-through decoration-1" : "text-hg-ink")}>
          {item.step.lever.title}
        </p>
        <StatusLine item={item} />
      </div>
      {!done && (
        <Link href={callHref(item.step.id)} className={buttonVariants({ size: "sm", variant: "outline", className: "shrink-0" })}>
          {item.status.kind === "unclear" ? <RotateCcw className="size-3.5" aria-hidden /> : <Phone className="size-3.5" aria-hidden />}
          Call
        </Link>
      )}
    </motion.li>
  );
}

function CallListView({ caseFile }: { caseFile: CaseFile }) {
  const [today] = useState(todayIso);
  const cards = useMemo(() => cardsAfterWins(caseFile.cards, caseFile.calls), [caseFile.cards, caseFile.calls]);
  const list = useMemo(() => buildCallList(analyze(cards, today).plan, cards, caseFile.calls), [cards, caseFile.calls, today]);
  const banks = new Set(list.groups.map((group) => group.bank)).size;
  const donePercent = list.total > 0 ? (list.done / list.total) * 100 : 0;

  return (
    <div>
      <section className={cn("relative isolate overflow-hidden rounded-[32px] p-6 text-white sm:rounded-[40px] sm:p-10", BLUE_GRADIENT)}>
        <Image
          src="/app/3d/headphones-3d.png"
          alt=""
          width={210}
          height={252}
          priority
          className="pointer-events-none absolute -top-1.5 right-9 -z-10 hidden h-[252px] w-[210px] select-none xl:block"
        />
        <Stagger onMount gap={0.07}>
          <StaggerItem>
            <p className="inline-flex rounded-full bg-white/8 px-3 py-1 text-[13px] leading-[18px] font-semibold text-white">Your calls</p>
          </StaggerItem>
          <StaggerItem>
            <h1 className="mt-5 text-[clamp(32px,4.5vw,48px)] leading-[1.1] font-semibold tracking-[-0.035em] text-white [&_em]:text-[#c9dbff]!">
              {list.total} {list.total === 1 ? "call" : "calls"} to <em>{banks === 1 ? "one bank" : `${banks} banks`}</em>
            </h1>
          </StaggerItem>
          <StaggerItem>
            <p className="mt-3.5 max-w-[540px] text-[18px] leading-7 font-medium tracking-[-0.01em] text-white/68">
              Haggle makes every call on this list for you, one after another. You only listen in when the bank needs to verify it&apos;s you.
            </p>
          </StaggerItem>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <StaggerItem>
              <div className={GLASS}>
                <p className={cn(STAT_LABEL, "text-white/68")}>Done</p>
                <p className={cn(STAT_VALUE, "text-white")}>
                  {list.done} of {list.total}
                </p>
                <div aria-hidden className="mt-3.5 h-1.5 overflow-hidden rounded-full border border-white/16 bg-white/10">
                  <motion.div
                    className="h-full rounded-full bg-white"
                    initial={{ width: "0%" }}
                    animate={{ width: `${donePercent}%` }}
                    transition={{ duration: 0.7, ease: EASE, delay: 0.35 }}
                  />
                </div>
              </div>
            </StaggerItem>
            <StaggerItem>
              <div className="h-full rounded-[24px] bg-white p-6 text-hg-ink">
                <p className={STAT_LABEL}>Still to win</p>
                <p className={STAT_VALUE}>
                  <CountUpDollars cents={list.openValueCents} />
                </p>
                <p className="mt-1 text-sm font-medium">a year, at average results</p>
              </div>
            </StaggerItem>
            <StaggerItem>
              <div className={GLASS}>
                <p className={cn(STAT_LABEL, "text-white/68")}>Already won</p>
                <p className={cn(STAT_VALUE, "text-white")}>
                  <CountUpDollars cents={list.wonCents} />
                </p>
                <p className="mt-1 text-sm font-medium text-white/68">a year</p>
              </div>
            </StaggerItem>
          </div>

          <StaggerItem>
            {list.next ? (
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link href={callHref(list.next.id)} className={cn(buttonVariants({ size: "lg" }), "group w-fit", ON_PANEL_BUTTON)}>
                  <Phone className="size-4" aria-hidden />
                  {list.done === 0 ? "Start the first call" : "Make the next call"}
                  <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden />
                </Link>
                <p className="text-sm font-medium text-white/68">{list.next.lever.title}. A practice call: you play the bank.</p>
              </div>
            ) : (
              list.total > 0 && <p className="mt-6 font-semibold text-white">Every call on the list is done.</p>
            )}
          </StaggerItem>
        </Stagger>
      </section>

      <Stagger className="mt-10 space-y-4" gap={0.1} amount={0.05}>
        {list.groups.map((group) => (
          <StaggerItem key={group.cardId}>
            <div className="overflow-hidden rounded-[28px] border border-hg-line/80 bg-white">
              <div className={cn("flex flex-wrap items-baseline gap-x-2.5 gap-y-1 px-5 py-4 sm:px-6", INK_GRADIENT)}>
                <h2 className="text-[20px] leading-7 font-semibold tracking-[-0.035em] text-white">{group.bank}</h2>
                <p className="text-sm font-medium text-white/68">{group.card}</p>
                <Badge tone="outline" className="ml-auto border-white/14 bg-white/8 text-white/68">
                  {group.items.length} {group.items.length === 1 ? "ask" : "asks"}
                </Badge>
              </div>
              <Stagger as="ul" gap={0.06} delay={0.1} amount={0.1} className="space-y-1 bg-[#f3f5f9]/50 p-2">
                {group.items.map((item) => (
                  <Row key={item.step.id} item={item} />
                ))}
              </Stagger>
            </div>
          </StaggerItem>
        ))}
      </Stagger>

      <Link href="/start" className={buttonVariants({ variant: "outline", className: "group mt-6 bg-white" })}>
        <Plus className="size-4 transition-transform duration-300 group-hover:rotate-90" aria-hidden />
        Add a card from another bank
      </Link>
    </div>
  );
}

/** /calls: one to-do list of every call, across every bank. */
export function CallListScreen() {
  const { caseFile, ready } = useCaseFile();
  if (!ready) {
    return (
      <div
        className="h-72 animate-[hg-shimmer_1.6s_linear_infinite] rounded-[28px] bg-[linear-gradient(90deg,#e7ecf5_25%,#f5f7fb_50%,#e7ecf5_75%)] bg-size-[200%_100%]"
        role="status"
        aria-label="Loading your calls"
      />
    );
  }
  if (!caseFile || caseFile.cards.length === 0) {
    return (
      <section
        className={cn(
          "mx-auto max-w-[640px] overflow-hidden rounded-[32px] px-6 pt-[22px] pb-10 text-center text-white sm:rounded-[40px] sm:pb-12",
          BLUE_GRADIENT,
        )}
      >
        <Stagger onMount gap={0.08}>
          <StaggerItem>
            <Image
              src="/app/3d/headphones-3d.png"
              alt=""
              width={210}
              height={252}
              priority
              className="pointer-events-none mx-auto h-auto w-[170px] select-none sm:w-[210px]"
            />
          </StaggerItem>
          <StaggerItem>
            <h1 className="relative -mt-4 text-[clamp(28px,4vw,34px)] leading-[1.15] font-semibold tracking-[-0.035em] text-white sm:-mt-[18px] [&_em]:text-[#a9c6ff]!">
              No calls <em>yet</em>
            </h1>
          </StaggerItem>
          <StaggerItem>
            <p className="mx-auto mt-3 max-w-[520px] text-[16px] leading-6 font-medium text-white/68">
              Add your card statements, from any bank, and every call worth making lands here.
            </p>
          </StaggerItem>
          <StaggerItem>
            <Link href="/start" className={cn(buttonVariants({ size: "lg" }), "mt-6", ON_PANEL_BUTTON)}>
              Add statements
            </Link>
          </StaggerItem>
        </Stagger>
      </section>
    );
  }
  return (
    <NumbersBoundary key={caseFile.cards.map((card) => card.id).join("|")}>
      <CallListView caseFile={caseFile} />
    </NumbersBoundary>
  );
}
