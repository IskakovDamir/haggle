"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, LoaderCircle } from "lucide-react";
import { EASE, Stagger, StaggerItem } from "@/components/motion/reveal";
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
    <li className={cn("flex items-center gap-3 transition-colors duration-300", state === "next" && "text-muted")}>
      <span
        className={cn(
          "relative flex size-7 shrink-0 items-center justify-center rounded-full transition-[background-color,border-color,color] duration-300",
          state === "done" && "bg-hg-blue text-white",
          state === "now" && "bg-hg-blue-soft text-hg-blue",
          state === "next" && "border border-line",
        )}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          {state === "done" && (
            <motion.span
              key="done"
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.4, opacity: 0 }}
              transition={{ duration: 0.3, ease: EASE }}
            >
              <Check className="size-3.5" aria-hidden />
            </motion.span>
          )}
          {state === "now" && (
            <motion.span
              key="now"
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.4, opacity: 0 }}
              transition={{ duration: 0.3, ease: EASE }}
            >
              <LoaderCircle className="size-3.5 animate-spin" aria-hidden />
            </motion.span>
          )}
        </AnimatePresence>
        {state === "now" && <span aria-hidden className="absolute inset-0 animate-ping rounded-full bg-hg-blue/15 [animation-duration:1.8s]" />}
      </span>
      <span className={cn(state === "now" ? "font-semibold text-hg-ink" : "font-medium")}>{children}</span>
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
  // The bar only moves with the real steps: a share per finished step, plus the upload's own share while it is sent.
  const filled = ((at + (progress.phase === "uploading" ? progress.sent : 0.5)) / PHASES.length) * 100;

  return (
    <Card className="relative mx-auto max-w-xl overflow-hidden rounded-[32px] p-6 sm:p-9">
      <span
        aria-hidden
        className="pointer-events-none absolute -top-28 -right-24 size-72 rounded-full bg-hg-blue-tint/70 blur-3xl"
      />
      <Stagger onMount gap={0.07} className="relative">
        <StaggerItem>
          <h1 className="text-[clamp(26px,3.5vw,34px)] leading-tight font-semibold tracking-[-0.035em] text-hg-ink">
            Reading <em>{label}</em>
          </h1>
        </StaggerItem>

        <StaggerItem>
          <div aria-hidden className="mt-6 h-2 overflow-hidden rounded-full bg-hg-surface">
            <motion.div
              className="h-full rounded-full bg-[linear-gradient(90deg,#2f6bff_0%,#8db6ff_50%,#2f6bff_100%)] bg-size-[200%_100%] animate-[hg-shimmer_1.6s_linear_infinite]"
              initial={{ width: "0%" }}
              animate={{ width: `${filled}%` }}
              transition={{ duration: 0.6, ease: EASE }}
            />
          </div>
        </StaggerItem>

        {/* Only the steps are announced. The ticking seconds would be read out every second. */}
        <StaggerItem>
          <div role="status" className="mt-6">
            <ol className="space-y-3.5">
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
        </StaggerItem>
        <StaggerItem>
          <p className="mt-6 text-sm font-medium text-muted">
            <span aria-hidden className="tabular">
              {seconds} s.{" "}
            </span>
            Reading can take up to a minute. Then you check every number before anything is calculated.
          </p>
        </StaggerItem>
        <StaggerItem>
          <Button variant="outline" className="mt-5" onClick={onCancel}>
            Cancel
          </Button>
        </StaggerItem>
      </Stagger>
    </Card>
  );
}
