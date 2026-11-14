"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { EASE, Stagger, StaggerItem } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";
import type { BatchItem } from "./batch";

const STATE_TEXT: Record<BatchItem["state"], string> = {
  reading: "Reading…",
  ready: "Read",
  failed: "Could not read",
  saved: "Added to your plan",
  skipped: "Skipped",
};

function StateIcon({ state }: { state: BatchItem["state"] }) {
  const kind = state === "reading" ? "reading" : state === "ready" || state === "saved" ? "ok" : "off";
  return (
    <span className="relative mt-0.5 flex size-5 shrink-0 items-center justify-center">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={kind}
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.4, opacity: 0 }}
          transition={{ duration: 0.3, ease: EASE }}
          className="flex"
        >
          {kind === "reading" && <Loader2 className="size-5 animate-spin text-hg-blue" aria-hidden />}
          {kind === "ok" && <CheckCircle2 className="size-5 text-hg-blue" aria-hidden />}
          {kind === "off" && <XCircle className="size-5 text-muted" aria-hidden />}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

/** Every statement in the batch with where it stands. Shown while they are read and when some failed. */
export function BatchPanel({ items, onCancel, onDone }: { items: BatchItem[]; onCancel: () => void; onDone?: () => void }) {
  const reading = items.some((item) => item.state === "reading");
  const finished = items.filter((item) => item.state !== "reading").length;

  return (
    <Stagger onMount gap={0.07}>
      <StaggerItem>
        <h1 className="text-[clamp(32px,4.5vw,48px)] leading-[1.1] font-semibold tracking-[-0.035em] text-hg-ink">
          {reading ? (
            <>
              Reading {items.length} <em>statements</em>
            </>
          ) : (
            <>
              Some statements could <em>not be read</em>
            </>
          )}
        </h1>
      </StaggerItem>
      <StaggerItem>
        <p className="mt-4 max-w-[60ch] text-[18px] leading-7 font-medium tracking-[-0.01em] text-muted">
          {reading
            ? "Each one is read the same way, a few seconds apiece. You will check every card before anything is saved."
            : "You can upload those again, or type their numbers in."}
        </p>
      </StaggerItem>

      <StaggerItem>
        <Card className="mt-8 overflow-hidden rounded-[28px]">
          <div aria-hidden className="h-1.5 bg-hg-surface">
            <motion.div
              className={cn(
                "h-full rounded-r-full",
                reading
                  ? "bg-[linear-gradient(90deg,#2f6bff_0%,#8db6ff_50%,#2f6bff_100%)] bg-size-[200%_100%] animate-[hg-shimmer_1.6s_linear_infinite]"
                  : "bg-hg-blue",
              )}
              initial={{ width: "0%" }}
              animate={{ width: `${(finished / Math.max(items.length, 1)) * 100}%` }}
              transition={{ duration: 0.6, ease: EASE }}
            />
          </div>
          <Stagger as="ul" onMount gap={0.06} delay={0.15} className="divide-y divide-line">
            {items.map((item) => (
              <StaggerItem as="li" key={item.key}>
                <div
                  className={cn(
                    "flex items-start gap-3 p-4 transition-colors duration-300 sm:p-5",
                    item.state === "reading" && "bg-hg-blue-soft/40",
                  )}
                  aria-live="polite"
                >
                  <StateIcon state={item.state} />
                  <div className="min-w-0">
                    <p className="truncate font-semibold tracking-[-0.01em] text-hg-ink">{item.label}</p>
                    <p className="text-sm font-medium text-muted">
                      {item.state === "failed" && item.message ? item.message : STATE_TEXT[item.state]}
                    </p>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </Card>
      </StaggerItem>

      <StaggerItem className="mt-6 flex flex-wrap gap-3">
        {!reading && onDone && (
          <Button size="lg" onClick={onDone}>
            Go to your plan
          </Button>
        )}
        <Button variant={reading ? "outline" : "ghost"} size="lg" onClick={onCancel}>
          {reading ? "Cancel" : "Add statements again"}
        </Button>
      </StaggerItem>
    </Stagger>
  );
}
