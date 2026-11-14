"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import { ArrowRight, CheckCircle2, Circle, Phone, Plus, RotateCcw } from "lucide-react";
import { callHref } from "@/components/call/resolve-call";
import { EASE, Stagger, StaggerItem } from "@/components/motion/reveal";
import { cardsAfterWins } from "@/components/plan/apply-wins";
import { CountUpDollars } from "@/components/plan/count-up";
import { NumbersBoundary } from "@/components/plan/numbers-boundary";
import { buttonVariants } from "@/components/ui/button";
import { Badge, Card } from "@/components/ui/primitives";
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

const STAT_LABEL = "text-[13px] font-semibold tracking-[-0.002em]";
const STAT_VALUE = "tabular mt-2 text-[34px] leading-[1.1] font-semibold tracking-[-0.035em]";

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
      <Stagger onMount gap={0.07}>
        <StaggerItem>
          <p className="inline-flex rounded-full bg-hg-blue-soft px-3 py-1 text-[13px] leading-[18px] font-semibold text-hg-blue">
            Your calls
          </p>
        </StaggerItem>
        <StaggerItem>
          <h1 className="mt-4 text-[clamp(32px,4.5vw,48px)] leading-[1.1] font-semibold tracking-[-0.035em] text-hg-ink">
            {list.total} {list.total === 1 ? "call" : "calls"} to <em>{banks === 1 ? "one bank" : `${banks} banks`}</em>
          </h1>
        </StaggerItem>
        <StaggerItem>
          <p className="mt-4 max-w-[60ch] text-[18px] leading-7 font-medium tracking-[-0.01em] text-muted">
            Haggle makes every call on this list for you, one after another. You only listen in when the bank needs to verify it&apos;s you.
          </p>
        </StaggerItem>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <StaggerItem>
            <Card className="h-full rounded-[28px] p-6">
              <p className={cn(STAT_LABEL, "text-muted")}>Done</p>
              <p className={cn(STAT_VALUE, "text-hg-ink")}>
                {list.done} of {list.total}
              </p>
              <div aria-hidden className="mt-4 h-1.5 overflow-hidden rounded-full bg-hg-surface">
                <motion.div
                  className="h-full rounded-full bg-hg-blue"
                  initial={{ width: "0%" }}
                  animate={{ width: `${donePercent}%` }}
                  transition={{ duration: 0.7, ease: EASE, delay: 0.35 }}
                />
              </div>
            </Card>
          </StaggerItem>
          <StaggerItem>
            <div className="hg-panel relative h-full overflow-hidden rounded-[28px] p-6 shadow-[0_20px_44px_-22px_rgb(47_107_255/0.8)]">
              <span aria-hidden className="pointer-events-none absolute -top-16 -right-12 size-40 rounded-full bg-white/15 blur-2xl" />
              <p className={cn(STAT_LABEL, "relative text-white/75")}>Still to win</p>
              <p className={cn(STAT_VALUE, "relative text-white")}>
                <CountUpDollars cents={list.openValueCents} />
              </p>
              <p className="relative mt-1 text-sm font-medium text-white/75">a year, at average results</p>
            </div>
          </StaggerItem>
          <StaggerItem>
            <Card className="h-full rounded-[28px] p-6">
              <p className={cn(STAT_LABEL, "text-muted")}>Already won</p>
              <p className={cn(STAT_VALUE, "text-hg-ink")}>
                <CountUpDollars cents={list.wonCents} />
              </p>
              <p className="mt-1 text-sm font-medium text-muted">a year</p>
            </Card>
          </StaggerItem>
        </div>

        <StaggerItem>
          {list.next ? (
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link href={callHref(list.next.id)} className={buttonVariants({ size: "lg", className: "group" })}>
                <Phone className="size-4" aria-hidden />
                {list.done === 0 ? "Start the first call" : "Make the next call"}
                <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden />
              </Link>
              <p className="text-sm font-medium text-muted">{list.next.lever.title}. A practice call: you play the bank.</p>
            </div>
          ) : (
            list.total > 0 && <p className="mt-6 font-semibold text-hg-blue">Every call on the list is done.</p>
          )}
        </StaggerItem>
      </Stagger>

      <Stagger className="mt-10 space-y-4" gap={0.1} amount={0.05}>
        {list.groups.map((group) => (
          <StaggerItem key={group.cardId}>
            <Card className="overflow-hidden rounded-[28px]">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-line bg-linear-to-b from-[#eef4fd] to-[#f7faff] px-5 py-4 sm:px-6">
                <h2 className="text-[20px] leading-7 font-semibold tracking-[-0.02em] text-hg-ink">{group.bank}</h2>
                <p className="text-sm font-medium text-muted">{group.card}</p>
                <Badge tone="outline" className="ml-auto bg-white">
                  {group.items.length} {group.items.length === 1 ? "ask" : "asks"}
                </Badge>
              </div>
              <Stagger as="ul" gap={0.06} delay={0.1} amount={0.1} className="space-y-1 bg-hg-surface/50 p-2">
                {group.items.map((item) => (
                  <Row key={item.step.id} item={item} />
                ))}
              </Stagger>
            </Card>
          </StaggerItem>
        ))}
      </Stagger>

      <Link href="/start" className={buttonVariants({ variant: "outline", className: "mt-6" })}>
        <Plus className="size-4" aria-hidden />
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
      <Card className="mx-auto max-w-xl rounded-[32px] p-6 text-center sm:p-10">
        <Stagger onMount gap={0.08}>
          <StaggerItem>
            <h1 className="text-[clamp(26px,3.5vw,34px)] leading-tight font-semibold tracking-[-0.035em] text-hg-ink">
              No calls <em>yet</em>
            </h1>
          </StaggerItem>
          <StaggerItem>
            <p className="mt-3 font-medium text-muted">Add your card statements, from any bank, and every call worth making lands here.</p>
          </StaggerItem>
          <StaggerItem>
            <Link href="/start" className={buttonVariants({ size: "lg", className: "mt-6" })}>
              Add statements
            </Link>
          </StaggerItem>
        </Stagger>
      </Card>
    );
  }
  return (
    <NumbersBoundary key={caseFile.cards.map((card) => card.id).join("|")}>
      <CallListView caseFile={caseFile} />
    </NumbersBoundary>
  );
}
