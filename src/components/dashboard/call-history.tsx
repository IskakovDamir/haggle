"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { formatDate } from "@/lib/format";
import { formatCents } from "@/lib/money";
import { Badge, Card } from "@/components/ui/primitives";
import type { CallRecord, CardAccount } from "@/lib/types";
import { cn } from "@/lib/utils";
import { goalLabel } from "@/components/call/ask";
import { formatClock } from "@/components/call/clock";
import { panel } from "@/components/call/panel-theme";
import { Transcript } from "@/components/call/transcript";
import { EASE, Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { WonCheck } from "@/components/plan/animated";
import { outcomeKind } from "@/components/win/outcome-kind";
import { callDate } from "./progress";
import { feeIsDue } from "./totals";

type BadgeTone = "green" | "leak" | "outline";

/** How a call ended, in one or two words. */
function resultBadge(call: CallRecord): { text: string; tone: BadgeTone } {
  if (!call.outcome) return { text: "No result", tone: "outline" };
  switch (outcomeKind(call.outcome)) {
    case "win":
      return { text: call.outcome.result === "partial" ? "Partial win" : "Win", tone: "green" };
    case "declined":
      return { text: "Declined", tone: "leak" };
    case "unconfirmed":
      return { text: "Not confirmed", tone: "outline" };
    case "unclear":
      return { text: "No answer", tone: "outline" };
  }
}

/** Length of the call from its first line to its last, as "6:42". */
function callLength(call: CallRecord): string {
  return formatClock(call.turns.at(-1)?.at ?? 0);
}

function CallRow({ call, card }: { call: CallRecord; card: CardAccount | undefined }) {
  const badge = resultBadge(call);
  const saved = call.savings?.annualSavingsCents ?? 0;
  const [open, setOpen] = useState(false);
  const contentId = useId();

  return (
    <Card
      className={cn(
        "overflow-hidden border-line shadow-none transition-[box-shadow,border-color] duration-300 hover:shadow-[0_1px_2px_rgb(11_18_32/0.04),0_20px_40px_-22px_rgb(11_18_32/0.25)] sm:rounded-[28px]",
        open && "border-hg-blue-tint",
      )}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={open ? contentId : undefined}
        onClick={() => setOpen((current) => !current)}
        className="flex w-full cursor-pointer flex-wrap items-center gap-x-4 gap-y-2 rounded-[inherit] p-5 text-left focus-visible:-outline-offset-4! sm:px-6"
      >
        <span className="block min-w-0 flex-1 basis-48">
          <span className="block font-semibold tracking-[-0.015em]">
            {goalLabel(call.goal)} · {card?.issuerName ?? "A card no longer in your case"}
          </span>
          <span className="tabular mt-0.5 block text-sm text-muted">
            {formatDate(callDate(call))} · {callLength(call)} · {call.mode === "voice" ? "voice" : call.mode === "phone" ? "phone" : "typed"} practice call
          </span>
        </span>
        {badge.tone === "green" && saved > 0 && (
          <span className="tabular text-lg font-semibold tracking-[-0.02em] text-hg-blue">{formatCents(saved)}</span>
        )}
        {badge.tone === "green" ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-hg-blue-soft py-0.5 pr-2.5 pl-1 text-xs font-semibold text-hg-blue">
            <WonCheck className="size-4" delay={0.2} />
            {badge.text}
          </span>
        ) : (
          <Badge tone={badge.tone}>{badge.text}</Badge>
        )}
        <motion.span
          aria-hidden
          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-hg-surface text-muted"
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.3, ease: EASE }}
        >
          <ChevronDown className="size-4" />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="transcript"
            id={contentId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ height: { duration: 0.45, ease: EASE }, opacity: { duration: 0.3, ease: EASE } }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-3 border-t border-line p-5 sm:px-6">
              {call.turns.length > 0 ? (
                <Transcript turns={call.turns} className={cn(panel.shell, "max-h-[28rem] p-4")} />
              ) : (
                <p className="text-sm text-muted">This call has no lines.</p>
              )}
              {call.outcome && (
                <Link
                  href={`/win?call=${encodeURIComponent(call.id)}`}
                  className="w-fit text-sm font-semibold text-hg-blue underline underline-offset-4"
                >
                  {feeIsDue(call) ? "Open the result and pay after your win" : "Open the result"}
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

/** Every call, newest first, each with its transcript behind a fold. */
export function CallHistory({ calls, cards }: { calls: CallRecord[]; cards: CardAccount[] }) {
  return (
    <section aria-labelledby="calls">
      <Reveal y={16}>
        <h2 id="calls" className="text-[clamp(28px,3.4vw,40px)] leading-[1.125] font-semibold text-hg-ink">
          Calls
        </h2>
      </Reveal>
      {calls.length === 0 ? (
        <Reveal className="mt-5">
          <Card className="border-line p-5 text-muted shadow-none sm:rounded-[28px] sm:p-6">No calls yet. Each call is kept here with its full transcript.</Card>
        </Reveal>
      ) : (
        <Stagger as="ul" gap={0.06} className="mt-5 flex flex-col gap-3">
          {calls.toReversed().map((call) => (
            <StaggerItem as="li" key={call.id}>
              <CallRow call={call} card={cards.find((candidate) => candidate.id === call.cardId)} />
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </section>
  );
}
