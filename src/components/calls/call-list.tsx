"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Circle, Phone, Plus, RotateCcw } from "lucide-react";
import { callHref } from "@/components/call/resolve-call";
import { cardsAfterWins } from "@/components/plan/apply-wins";
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

function StatusLine({ item }: { item: CallItem }) {
  const { status } = item;
  if (status.kind === "won") {
    return (
      <Link href={`/win?call=${encodeURIComponent(status.callId)}`} className="text-sm font-medium text-green underline-offset-2 hover:underline">
        Won · saves {formatDollars(status.savedCents)} a year
      </Link>
    );
  }
  if (status.kind === "declined") {
    return <p className="text-sm text-muted">The bank said no. Ask again on {formatDate(status.askAgainOn)}.</p>;
  }
  if (status.kind === "unclear") return <p className="text-sm text-muted">The last call had no clear result. Try again.</p>;
  const worth = item.step.lever.potentialAnnualCents;
  return <p className="text-sm text-muted">{worth > 0 ? `Worth about ${formatDollars(worth)} a year` : "Helps your credit score"}</p>;
}

function Row({ item }: { item: CallItem }) {
  const done = item.status.kind === "won" || item.status.kind === "declined";
  return (
    <li className="flex items-center gap-4 p-4 sm:p-5">
      {done ? (
        <CheckCircle2 className={cn("size-6 shrink-0", item.status.kind === "won" ? "text-green" : "text-muted")} aria-hidden />
      ) : (
        <Circle className="size-6 shrink-0 text-line" aria-hidden />
      )}
      <div className="min-w-0 flex-1">
        <p className={cn("font-semibold", done && "text-muted line-through decoration-1")}>{item.step.lever.title}</p>
        <StatusLine item={item} />
      </div>
      {!done && (
        <Link href={callHref(item.step.id)} className={buttonVariants({ size: "sm", variant: "outline", className: "shrink-0" })}>
          {item.status.kind === "unclear" ? <RotateCcw className="size-3.5" aria-hidden /> : <Phone className="size-3.5" aria-hidden />}
          Call
        </Link>
      )}
    </li>
  );
}

function CallListView({ caseFile }: { caseFile: CaseFile }) {
  const [today] = useState(todayIso);
  const cards = useMemo(() => cardsAfterWins(caseFile.cards, caseFile.calls), [caseFile.cards, caseFile.calls]);
  const list = useMemo(() => buildCallList(analyze(cards, today).plan, cards, caseFile.calls), [cards, caseFile.calls, today]);
  const banks = new Set(list.groups.map((group) => group.bank)).size;

  return (
    <div>
      <p className="text-xs font-bold tracking-widest text-green uppercase">Your calls</p>
      <h1 className="mt-3 text-3xl leading-[1.1] font-extrabold sm:text-[2.75rem]">
        {list.total} {list.total === 1 ? "call" : "calls"} to <em>{banks === 1 ? "one bank" : `${banks} banks`}</em>
      </h1>
      <p className="mt-3 max-w-[60ch] text-lg text-muted">
        Haggle makes every call on this list for you, one after another. You only listen in when the bank needs to verify it&apos;s you.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-xs font-semibold tracking-widest text-muted uppercase">Done</p>
          <p className="tabular mt-1.5 text-3xl font-extrabold">
            {list.done} of {list.total}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-semibold tracking-widest text-muted uppercase">Still to win</p>
          <p className="tabular mt-1.5 text-3xl font-extrabold text-green">{formatDollars(list.openValueCents)}</p>
          <p className="mt-1 text-sm text-muted">a year, at average results</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-semibold tracking-widest text-muted uppercase">Already won</p>
          <p className="tabular mt-1.5 text-3xl font-extrabold">{formatDollars(list.wonCents)}</p>
          <p className="mt-1 text-sm text-muted">a year</p>
        </Card>
      </div>

      {list.next ? (
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link href={callHref(list.next.id)} className={buttonVariants({ size: "lg" })}>
            <Phone className="size-4" aria-hidden />
            {list.done === 0 ? "Start the first call" : "Make the next call"}
          </Link>
          <p className="text-sm text-muted">{list.next.lever.title}. A practice call: you play the bank.</p>
        </div>
      ) : (
        list.total > 0 && <p className="mt-6 font-medium text-green">Every call on the list is done.</p>
      )}

      <div className="mt-10 space-y-4">
        {list.groups.map((group) => (
          <Card key={group.cardId} className="overflow-hidden">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-line bg-paper/60 px-4 py-3 sm:px-5">
              <h2 className="text-lg font-extrabold">{group.bank}</h2>
              <p className="text-sm text-muted">{group.card}</p>
              <Badge tone="outline" className="ml-auto">
                {group.items.length} {group.items.length === 1 ? "ask" : "asks"}
              </Badge>
            </div>
            <ul className="divide-y divide-line">
              {group.items.map((item) => (
                <Row key={item.step.id} item={item} />
              ))}
            </ul>
          </Card>
        ))}
      </div>

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
  if (!ready) return <div className="h-72 animate-pulse rounded-2xl bg-ink/7" role="status" aria-label="Loading your calls" />;
  if (!caseFile || caseFile.cards.length === 0) {
    return (
      <Card className="mx-auto max-w-xl p-6 text-center sm:p-10">
        <h1 className="text-2xl leading-tight font-extrabold sm:text-3xl">
          No calls <em>yet</em>
        </h1>
        <p className="mt-3 text-muted">Add your card statements, from any bank, and every call worth making lands here.</p>
        <Link href="/start" className={buttonVariants({ size: "lg", className: "mt-6" })}>
          Add statements
        </Link>
      </Card>
    );
  }
  return (
    <NumbersBoundary key={caseFile.cards.map((card) => card.id).join("|")}>
      <CallListView caseFile={caseFile} />
    </NumbersBoundary>
  );
}
