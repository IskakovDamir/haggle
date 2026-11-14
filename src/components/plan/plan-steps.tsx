import Link from "next/link";
import { CalendarClock, Phone } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Badge, Card } from "@/components/ui/primitives";
import { Lift, Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import type { CallRecord, PlanStep } from "@/lib/types";
import { cn } from "@/lib/utils";
import { WonCheck } from "./animated";
import { OUTCOME_LABEL, lastCallFor, leverWorth, stepWhen } from "./labels";

/** True when the call ended with a yes, in full or in part. */
function isWon(call: CallRecord): boolean {
  const result = call.outcome?.result ?? "unclear";
  return result === "won" || result === "partial";
}

/** What has already happened on this step, with a link to the result. */
function LastCall({ call }: { call: CallRecord }) {
  const result = call.outcome?.result ?? "unclear";
  const won = isWon(call);
  return (
    <p className="mt-2.5 flex flex-wrap items-center gap-2 text-sm">
      {won ? (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-hg-blue-soft py-0.5 pr-2.5 pl-1 text-xs font-semibold text-hg-blue">
          <WonCheck className="size-4" delay={0.2} />
          {OUTCOME_LABEL[result]}
        </span>
      ) : (
        <Badge tone="neutral">{OUTCOME_LABEL[result]}</Badge>
      )}
      <Link
        href={`/win?call=${encodeURIComponent(call.id)}`}
        className="font-medium underline decoration-line underline-offset-2 hover:decoration-ink"
      >
        See the result
      </Link>
    </p>
  );
}

function Step({ step, cardName, lastCall }: { step: PlanStep; cardName: string | null; lastCall: CallRecord | null }) {
  const worth = leverWorth(step.lever);
  const won = lastCall !== null && isWon(lastCall);

  return (
    <Card
      className={cn(
        "flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:rounded-[28px] sm:p-6",
        won && "border-hg-blue/25 bg-[linear-gradient(135deg,#ffffff_40%,var(--hg-blue-soft))]",
      )}
    >
      <div className="flex min-w-0 flex-1 items-start gap-4">
        <span
          className={cn(
            "tabular flex size-11 shrink-0 items-center justify-center rounded-2xl text-[17px] font-semibold tracking-[-0.02em] text-white",
            won ? "bg-hg-blue" : "bg-ink",
          )}
        >
          {step.order}
        </span>
        <div className="min-w-0">
          <h3 className="leading-snug font-semibold tracking-[-0.015em]">{step.lever.title}</h3>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-muted">
            {step.dueOn === null ? (
              <Badge tone="lime">Now</Badge>
            ) : (
              <Badge tone="outline">
                <CalendarClock className="size-3" aria-hidden />
                {stepWhen(step)}
              </Badge>
            )}
            {worth && <span className="tabular font-medium">about {worth} in the first year</span>}
            {cardName && <span>{cardName}</span>}
          </p>
          {lastCall && <LastCall call={lastCall} />}
        </div>
      </div>

      {step.lever.needsCall ? (
        <Link
          href={`/call?step=${encodeURIComponent(step.id)}`}
          className={buttonVariants({ variant: "outline", className: "shrink-0" })}
        >
          <Phone className="size-4" aria-hidden />
          {lastCall ? "Call again" : "Start the call"}
        </Link>
      ) : (
        <p className="shrink-0 text-sm text-muted sm:max-w-[18ch] sm:text-right">No call. You do this one yourself.</p>
      )}
    </Card>
  );
}

/** The plan in the engine's order. Every step that needs a call has its button. */
export function PlanSteps({
  steps,
  calls,
  cardNames,
}: {
  steps: PlanStep[];
  calls: CallRecord[];
  cardNames: Map<string, string>;
}) {
  if (steps.length === 0) {
    return (
      <Reveal>
        <Card className="p-5 text-muted sm:p-6">There are no steps to take on these cards right now.</Card>
      </Reveal>
    );
  }
  return (
    <Stagger as="ol" className="space-y-3">
      {steps.map((step) => (
        <StaggerItem as="li" key={step.id}>
          <Lift>
            <Step
              step={step}
              cardName={cardNames.size > 1 ? (cardNames.get(step.lever.cardId) ?? null) : null}
              lastCall={lastCallFor(calls, step)}
            />
          </Lift>
        </StaggerItem>
      ))}
    </Stagger>
  );
}
