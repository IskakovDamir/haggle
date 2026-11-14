import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { formatDate } from "@/lib/format";
import { Stagger, StaggerItem } from "@/components/motion/reveal";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/primitives";
import type { IsoDate, PlanStep } from "@/lib/types";
import { cn } from "@/lib/utils";
import { callHref } from "@/components/call/resolve-call";

/** "Today" for a step that is due, the date for one that waits. */
export function dueLabel(dueOn: IsoDate | null, today: IsoDate): string {
  return dueOn === null || dueOn <= today ? "Today" : formatDate(dueOn);
}

/**
 * The next step of the plan that has no win yet, with the way to do it. Renders nothing when the plan is done.
 * Its parts rise one after another, `delay` seconds after the screen opens.
 */
export function NextUp({
  step,
  today,
  primary = false,
  delay = 0,
}: {
  step: PlanStep | null;
  today: IsoDate;
  primary?: boolean;
  delay?: number;
}) {
  if (!step) return null;
  const needsCall = step.lever.needsCall;

  return (
    <Stagger onMount gap={0.08} delay={delay}>
      <StaggerItem>
        <Card className="relative overflow-hidden rounded-[28px] p-6 sm:p-7">
          <span aria-hidden className="absolute inset-y-6 left-0 w-1 rounded-r-full bg-hg-blue" />
          <Stagger
            onMount
            gap={0.08}
            delay={delay + 0.15}
            className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <StaggerItem as="p" className="text-xs font-semibold tracking-widest text-muted uppercase">
                Next in your plan · {dueLabel(step.dueOn, today)}
              </StaggerItem>
              <StaggerItem as="h2" className="mt-1.5 text-[20px] leading-tight font-semibold tracking-[-0.03em] text-hg-ink">
                {step.lever.title}
              </StaggerItem>
              <StaggerItem as="p" className="mt-1 text-sm text-muted">
                {step.lever.why}
              </StaggerItem>
            </div>
            <StaggerItem className="shrink-0">
              <Link
                href={needsCall ? callHref(step.id) : "/plan"}
                className={cn(buttonVariants({ size: "lg", variant: primary ? "default" : "outline" }), "group w-full sm:w-auto")}
              >
                {needsCall ? "Start the call" : "See the plan"}
                <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
              </Link>
            </StaggerItem>
          </Stagger>
        </Card>
      </StaggerItem>
    </Stagger>
  );
}
