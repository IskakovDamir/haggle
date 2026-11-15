import Link from "next/link";
import { CalendarClock, Phone } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Badge, Card } from "@/components/ui/primitives";
import { Lift, Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import type { CallRecord, PlanStep } from "@/lib/types";
import { cn } from "@/lib/utils";
import { WonCheck } from "./animated";
import { OUTCOME_LABEL, lastCallFor, leverWorth, stepWhen } from "./labels";
import { BLUE_PANEL, INK_PANEL } from "./surfaces";

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

/** How a step is filled: the next call is bright blue, a step you do yourself is dark ink, the rest are white. */
type StepTone = "blue" | "white" | "ink";

function Step({
  step,
  cardName,
  lastCall,
  current,
}: {
  step: PlanStep;
  cardName: string | null;
  lastCall: CallRecord | null;
  /** True for the next call to make, the one the plan's main button also starts. */
  current: boolean;
}) {
  const worth = leverWorth(step.lever);
  const won = lastCall !== null && isWon(lastCall);
  const tone: StepTone = won ? "white" : current ? "blue" : step.lever.needsCall ? "white" : "ink";
  const onDark = tone !== "white";

  return (
    <Card
      className={cn(
        "flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:rounded-[28px] sm:px-6 sm:py-[26px]",
        onDark && "border-transparent text-white",
        won && "border-hg-blue/25 bg-[linear-gradient(135deg,#ffffff_40%,var(--hg-blue-soft))]",
      )}
      style={tone === "blue" ? BLUE_PANEL : tone === "ink" ? INK_PANEL : undefined}
    >
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <span
          className={cn(
            "tabular flex size-11 shrink-0 items-center justify-center rounded-2xl text-[17px] font-semibold tracking-[-0.02em] text-white",
            won ? "bg-hg-blue" : "bg-hg-ink",
            tone === "ink" && "ring-1 ring-white/10",
          )}
        >
          {step.order}
        </span>
        <div className="min-w-0">
          <h3 className={cn("leading-snug font-semibold tracking-[-0.015em]", onDark ? "text-white" : "text-hg-ink")}>{step.lever.title}</h3>
          <p className={cn("mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm", onDark ? "text-white/68" : "text-muted")}>
            {step.dueOn === null ? (
              <Badge tone="lime" className={cn(tone === "blue" && "bg-white/16")}>
                Now
              </Badge>
            ) : (
              <Badge tone="outline" className={cn(onDark && "border-white/14 text-white/68")}>
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
          className={buttonVariants({
            variant: "outline",
            className: cn(
              "shrink-0 self-start sm:self-auto",
              tone === "blue" && "border-white/14 bg-white/8 text-white hover:border-white/30 hover:bg-white/16",
            ),
          })}
        >
          <Phone className="size-4" aria-hidden />
          {lastCall ? "Call again" : "Start the call"}
        </Link>
      ) : (
        <p className={cn("shrink-0 text-sm sm:max-w-[18ch] sm:text-right", onDark ? "text-white/68" : "text-muted")}>
          No call. You do this one yourself.
        </p>
      )}
    </Card>
  );
}

/** The plan in the engine's order. Every step that needs a call has its button. */
export function PlanSteps({
  steps,
  calls,
  cardNames,
  currentStepId = null,
}: {
  steps: PlanStep[];
  calls: CallRecord[];
  cardNames: Map<string, string>;
  /** The next call to make, drawn in bright blue. */
  currentStepId?: string | null;
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
              current={step.id === currentStepId}
            />
          </Lift>
        </StaggerItem>
      ))}
    </Stagger>
  );
}
