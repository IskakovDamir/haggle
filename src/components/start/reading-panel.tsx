"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Check, LoaderCircle } from "lucide-react";
import { EASE, Stagger, StaggerItem } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ReadingProgress } from "./read-statement";
import { sampleArt } from "./sample-art";
import { SURFACE } from "./surfaces";

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
    <li className={cn("flex items-center gap-3 text-white transition-colors duration-300", state === "next" && "text-white/60")}>
      <span
        className={cn(
          "relative flex size-7 shrink-0 items-center justify-center rounded-full transition-[background-color,border-color,color] duration-300",
          state === "done" && "bg-white/10 text-white",
          state === "now" && "bg-white/15 text-white",
          state === "next" && "border border-white/30",
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
        {state === "now" && <span aria-hidden className="absolute inset-0 animate-ping rounded-full bg-white/15 [animation-duration:1.8s]" />}
      </span>
      <span className={cn("text-base", state === "now" ? "font-semibold" : "font-medium")}>{children}</span>
    </li>
  );
}

/** What is happening to the statement right now. The steps follow the real request, not a timer. */
export function ReadingPanel({
  label,
  progress,
  onCancel,
  sampleId,
}: {
  label: string;
  progress: ReadingProgress;
  onCancel: () => void;
  /** Which sample is read, so the card in the corner is that bank's. Uploads show the default card. */
  sampleId?: string;
}) {
  const art = sampleArt(sampleId);
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
    <div className={cn(SURFACE.blue, "relative mx-auto max-w-xl overflow-hidden rounded-[28px] p-6 sm:p-9")}>
      <span aria-hidden className="pointer-events-none absolute -top-28 -right-24 size-72 rounded-full bg-white/[0.08]" />
      {/* The statement's card under a magnifying glass, cut off by the top edge as in the design. */}
      <span aria-hidden className="pointer-events-none absolute -top-[18px] -right-6 hidden w-[170px] sm:block">
        <Image src={art.src} alt="" width={art.width} height={art.height} priority className="h-auto w-full" />
      </span>
      <motion.span
        aria-hidden
        animate={{ x: [0, -10, 4, 0], y: [0, 6, 10, 0], rotate: [0, -6, 3, 0] }}
        transition={{ duration: 4.5, ease: "easeInOut", repeat: Infinity }}
        className="pointer-events-none absolute -top-5 -right-2.5 hidden w-[150px] sm:block"
      >
        <Image src="/app/3d/magnifier-3d.png" alt="" width={150} height={161} priority className="h-auto w-full" />
      </motion.span>
      <Stagger onMount gap={0.07} className="relative">
        <StaggerItem>
          <h1 className="text-[clamp(26px,3.5vw,34px)] leading-tight font-semibold tracking-[-0.035em] text-white">
            Reading <span className="text-white/70">{label}</span>
          </h1>
        </StaggerItem>

        <StaggerItem>
          <div aria-hidden className="mt-6 h-2 overflow-hidden rounded-full bg-white/15">
            <motion.div
              className="h-full rounded-full bg-[linear-gradient(90deg,rgb(255_255_255/0.45)_0%,#ffffff_50%,rgb(255_255_255/0.45)_100%)] bg-size-[200%_100%] animate-[hg-shimmer_1.6s_linear_infinite]"
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
          <p className="mt-6 text-sm font-medium text-white/70">
            <span aria-hidden className="tabular">
              {seconds} s.{" "}
            </span>
            Reading can take up to a minute. Then you check every number before anything is calculated.
          </p>
        </StaggerItem>
        <StaggerItem>
          <Button
            variant="outline"
            className="mt-5 border-white/30 bg-white/10 text-white hover:border-white/60 hover:bg-white/20"
            onClick={onCancel}
          >
            Cancel
          </Button>
        </StaggerItem>
      </Stagger>
    </div>
  );
}
