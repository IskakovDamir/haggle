"use client";

import { useEffect, useState } from "react";
import { Check, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";
import type { ReadingProgress } from "./read-statement";

const PHASES: ReadingProgress["phase"][] = ["preparing", "uploading", "reading"];

/** Whole seconds since this component appeared. */
function useSecondsWaited(): number {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setSeconds((current) => current + 1), 1000);
    return () => window.clearInterval(timer);
  }, []);
  return seconds;
}

function Step({ state, children }: { state: "done" | "now" | "next"; children: React.ReactNode }) {
  return (
    <li className={cn("flex items-center gap-3", state === "next" && "text-muted")}>
      <span
        className={cn(
          "flex size-6 shrink-0 items-center justify-center rounded-full",
          state === "done" && "bg-green text-white",
          state === "now" && "bg-lime",
          state === "next" && "border border-line",
        )}
      >
        {state === "done" && <Check className="size-3.5" aria-hidden />}
        {state === "now" && <LoaderCircle className="size-3.5 animate-spin" aria-hidden />}
      </span>
      <span className={cn(state === "now" && "font-semibold")}>{children}</span>
    </li>
  );
}

/** What is happening to the statement right now. The steps follow the real request, not a timer. */
export function ReadingPanel({
  label,
  progress,
  onCancel,
}: {
  label: string;
  progress: ReadingProgress;
  onCancel: () => void;
}) {
  const seconds = useSecondsWaited();
  const at = PHASES.indexOf(progress.phase);
  const stateOf = (phase: ReadingProgress["phase"]) => {
    const index = PHASES.indexOf(phase);
    return index < at ? "done" : index === at ? "now" : "next";
  };
  const sentPercent = progress.phase === "uploading" ? Math.round(progress.sent * 100) : null;

  return (
    <Card className="mx-auto max-w-xl p-6 sm:p-8">
      <h1 className="text-2xl leading-tight font-extrabold sm:text-3xl">
        Reading <em>{label}</em>
      </h1>
      {/* Only the steps are announced. The ticking seconds would be read out every second. */}
      <div role="status" className="mt-6">
        <ol className="space-y-3">
          <Step state={stateOf("preparing")}>Getting the file ready</Step>
          <Step state={stateOf("uploading")}>
            Sending it
            {sentPercent !== null && (
              <span aria-hidden className="tabular font-normal text-muted">
                {" "}
                {sentPercent}%
              </span>
            )}
          </Step>
          <Step state={stateOf("reading")}>Claude is reading the statement</Step>
        </ol>
      </div>
      <p className="mt-6 text-sm text-muted">
        <span aria-hidden className="tabular">
          {seconds} s.{" "}
        </span>
        Reading can take up to a minute. Then you check every number before anything is calculated.
      </p>
      <Button variant="outline" className="mt-5" onClick={onCancel}>
        Cancel
      </Button>
    </Card>
  );
}
