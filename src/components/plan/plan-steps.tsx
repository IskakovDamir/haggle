import Link from "next/link";
import { CalendarClock, Phone } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Badge, Card } from "@/components/ui/primitives";
import type { CallRecord, PlanStep } from "@/lib/types";
import { OUTCOME_LABEL, lastCallFor, leverWorth, stepWhen } from "./labels";

/** What has already happened on this step, with a link to the result. */
function LastCall({ call }: { call: CallRecord }) {
  const result = call.outcome?.result ?? "unclear";
  const won = result === "won" || result === "partial";
  return (
    <p className="mt-2 flex flex-wrap items-center gap-2 text-sm">
      <Badge tone={won ? "green" : "neutral"}>{OUTCOME_LABEL[result]}</Badge>
      <Link href={`/win?call=${encodeURIComponent(call.id)}`} className="underline decoration-line underline-offset-2 hover:decoration-ink">
        See the result
      </Link>
    </p>
  );
}

function Step({ step, cardName, lastCall }: { step: PlanStep; cardName: string | null; lastCall: CallRecord | null }) {
  const worth = leverWorth(step.lever);

  return (
    <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:p-6">
      <div className="flex min-w-0 flex-1 items-start gap-4">
        <span className="tabular flex size-10 shrink-0 items-center justify-center rounded-xl bg-ink font-extrabold text-paper">
          {step.order}
        </span>
        <div className="min-w-0">
          <h3 className="leading-snug font-semibold">{step.lever.title}</h3>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-muted">
            {step.dueOn === null ? (
              <Badge tone="lime">Now</Badge>
            ) : (
              <Badge tone="outline">
                <CalendarClock className="size-3" aria-hidden />
                {stepWhen(step)}
              </Badge>
            )}
            {worth && <span className="tabular">about {worth} in the first year</span>}
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
    return <Card className="p-5 text-muted sm:p-6">There are no steps to take on these cards right now.</Card>;
  }
  return (
    <ol className="space-y-3">
      {steps.map((step) => (
        <li key={step.id}>
          <Step
            step={step}
            cardName={cardNames.size > 1 ? (cardNames.get(step.lever.cardId) ?? null) : null}
            lastCall={lastCallFor(calls, step)}
          />
        </li>
      ))}
    </ol>
  );
}
