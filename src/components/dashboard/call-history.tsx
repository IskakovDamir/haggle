"use client";

import Link from "next/link";
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

  return (
    <Card className="overflow-hidden">
      <details className="group">
        <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-4 gap-y-2 p-5 [&::-webkit-details-marker]:hidden">
          <div className="min-w-0 flex-1 basis-48">
            <p className="font-semibold">
              {goalLabel(call.goal)} · {card?.issuerName ?? "A card no longer in your case"}
            </p>
            <p className="tabular text-sm text-muted">
              {formatDate(callDate(call))} · {callLength(call)} · {call.mode === "voice" ? "voice" : "typed"} practice call
            </p>
          </div>
          {badge.tone === "green" && saved > 0 && <span className="tabular font-extrabold text-green">{formatCents(saved)}</span>}
          <Badge tone={badge.tone}>{badge.text}</Badge>
          <ChevronDown className="size-5 shrink-0 text-muted transition-transform group-open:rotate-180" aria-hidden />
        </summary>

        <div className="flex flex-col gap-3 border-t border-line p-5">
          {call.turns.length > 0 ? (
            <Transcript turns={call.turns} className={cn(panel.shell, "max-h-[28rem] p-4")} />
          ) : (
            <p className="text-sm text-muted">This call has no lines.</p>
          )}
          {call.outcome && (
            <Link href={`/win?call=${encodeURIComponent(call.id)}`} className="w-fit text-sm font-medium text-green underline underline-offset-4">
              {feeIsDue(call) ? "Open the result and pay after your win" : "Open the result"}
            </Link>
          )}
        </div>
      </details>
    </Card>
  );
}

/** Every call, newest first, each with its transcript behind a fold. */
export function CallHistory({ calls, cards }: { calls: CallRecord[]; cards: CardAccount[] }) {
  return (
    <section aria-labelledby="calls">
      <h2 id="calls" className="text-2xl font-extrabold">
        Calls
      </h2>
      {calls.length === 0 ? (
        <Card className="mt-4 p-5 text-muted">No calls yet. Each call is kept here with its full transcript.</Card>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {calls.toReversed().map((call) => (
            <li key={call.id}>
              <CallRow call={call} card={cards.find((candidate) => candidate.id === call.cardId)} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
