import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { formatDate } from "@/lib/format";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/primitives";
import type { IsoDate, PlanStep } from "@/lib/types";
import { cn } from "@/lib/utils";
import { callHref } from "@/components/call/resolve-call";

/** "Today" for a step that is due, the date for one that waits. */
export function dueLabel(dueOn: IsoDate | null, today: IsoDate): string {
  return dueOn === null || dueOn <= today ? "Today" : formatDate(dueOn);
}

/** The next step of the plan that has no win yet, with the way to do it. Renders nothing when the plan is done. */
export function NextUp({ step, today, primary = false }: { step: PlanStep | null; today: IsoDate; primary?: boolean }) {
  if (!step) return null;
  const needsCall = step.lever.needsCall;

  return (
    <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
      <div className="min-w-0">
        <p className="text-xs font-semibold tracking-widest text-muted uppercase">
          Next in your plan · {dueLabel(step.dueOn, today)}
        </p>
        <h2 className="mt-1 text-lg font-extrabold">{step.lever.title}</h2>
        <p className="mt-1 text-sm text-muted">{step.lever.why}</p>
      </div>
      <Link
        href={needsCall ? callHref(step.id) : "/plan"}
        className={cn(buttonVariants({ size: "lg", variant: primary ? "default" : "outline" }), "shrink-0")}
      >
        {needsCall ? "Start the call" : "See the plan"}
        <ArrowRight className="size-4" aria-hidden />
      </Link>
    </Card>
  );
}
