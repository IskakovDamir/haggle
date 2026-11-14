"use client";

import Link from "next/link";
import { CalendarPlus } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/primitives";
import type { IsoDate } from "@/lib/types";
import { callHref } from "@/components/call/resolve-call";
import { dueLabel } from "@/components/win/next-up";
import { buildIcs } from "./ics";
import { calendarEventsFor, type NextStep } from "./progress";

const KIND_LABELS: Record<NextStep["kind"], string> = {
  plan: "From your plan",
  ask_again: "Ask again",
  follow_up: "Follow up",
};

/** Build the .ics file in the browser and hand it to the visitor as a download. */
function downloadCalendar(steps: NextStep[], caseId: string) {
  const file = new Blob([buildIcs(calendarEventsFor(steps, caseId), new Date())], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = "haggle-next-steps.ics";
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/** What is still to do, soonest first, each with its date. One button puts all of it in a calendar. */
export function NextSteps({ steps, caseId, today }: { steps: NextStep[]; caseId: string; today: IsoDate }) {
  return (
    <section aria-labelledby="next-steps">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="next-steps" className="text-2xl font-extrabold">
            Next steps
          </h2>
          <p className="mt-1 text-muted">Each one has a date, so nothing is left to memory.</p>
        </div>
        {steps.length > 0 && (
          <Button variant="outline" onClick={() => downloadCalendar(steps, caseId)}>
            <CalendarPlus className="size-4" aria-hidden />
            Add to calendar (.ics)
          </Button>
        )}
      </div>

      {steps.length === 0 ? (
        <Card className="mt-4 p-5 text-muted">Nothing is waiting. Every step in your plan has a win.</Card>
      ) : (
        <ol className="mt-4 flex flex-col gap-3">
          {steps.map((step) => (
            <li key={step.id}>
              <Card className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:gap-5">
                <div className="shrink-0 sm:w-32">
                  <p className="tabular font-extrabold">{dueLabel(step.dueOn, today)}</p>
                  <p className="text-xs text-muted">{KIND_LABELS[step.kind]}</p>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold">{step.title}</h3>
                  <p className="mt-0.5 text-sm text-muted">{step.detail}</p>
                </div>
                {step.callStepId && step.dueOn <= today && (
                  <Link href={callHref(step.callStepId)} className={buttonVariants({ className: "shrink-0" })}>
                    Start the call
                  </Link>
                )}
              </Card>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
