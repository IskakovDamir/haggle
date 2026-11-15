"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FileText, FileUp, Keyboard, type LucideIcon } from "lucide-react";
import { EASE, Stagger, StaggerItem } from "@/components/motion/reveal";
import type { SampleStatement } from "@/lib/statement/samples";
import type { Extraction } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ManualPanel } from "./manual-panel";
import { SamplePanel } from "./sample-panel";
import { UploadPanel } from "./upload-panel";

export type Way = "upload" | "sample" | "type";

const WAYS: { id: Way; label: string; icon: LucideIcon; needsReading: boolean }[] = [
  { id: "upload", label: "Upload", icon: FileUp, needsReading: true },
  { id: "sample", label: "Sample", icon: FileText, needsReading: true },
  { id: "type", label: "Type it in", icon: Keyboard, needsReading: false },
];

/** The three ways to get a statement in. With reading switched off, only typing is left. */
export function WaysIn({
  readingOff,
  startWith,
  problem,
  onFiles,
  onSample,
  onAllSamples,
  onEntry,
}: {
  readingOff: boolean;
  startWith: Way;
  /** Why the last attempt failed, as one sentence. */
  problem: string | null;
  onFiles: (files: File[]) => void;
  onSample: (sample: SampleStatement) => void;
  onAllSamples: () => void;
  onEntry: (extraction: Extraction) => void;
}) {
  const [chosen, setChosen] = useState<Way | null>(null);
  const way = readingOff ? "type" : (chosen ?? startWith);

  return (
    <Stagger onMount gap={0.07}>
      <StaggerItem>
        <h1 className="text-[clamp(32px,4.5vw,48px)] leading-[1.1] font-semibold tracking-[-0.035em] text-hg-ink">
          Bring in your <em>statements</em>
        </h1>
      </StaggerItem>
      <StaggerItem>
        <p className="mt-4 max-w-2xl text-[18px] leading-7 font-medium tracking-[-0.01em] text-muted">
          One statement is enough to start. Add every card you have, from every bank, and Haggle builds one plan and one list of calls.
        </p>
      </StaggerItem>

      {readingOff && (
        <StaggerItem>
          <p className="mt-6 rounded-[20px] border border-hg-blue-tint bg-hg-blue-soft p-4 text-sm text-hg-ink-2">
            Statement reading is not set up on this server, so uploads and sample statements are switched off. Typing the
            numbers works, and so does everything after it.
          </p>
        </StaggerItem>
      )}
      <AnimatePresence initial={false}>
        {problem && (
          <motion.p
            key={problem}
            role="alert"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="mt-6 rounded-[20px] border border-alarm/30 bg-alarm-soft p-4 text-sm text-alarm"
          >
            {problem}
          </motion.p>
        )}
      </AnimatePresence>

      <StaggerItem>
        <div
          role="tablist"
          aria-label="How to add a statement"
          className="mt-8 grid grid-cols-3 gap-1 rounded-full border border-line bg-card p-1 shadow-[0_1px_2px_rgb(11_18_32/0.04),0_10px_28px_-18px_rgb(11_18_32/0.25)] sm:inline-grid"
        >
          {WAYS.map(({ id, label, icon: Icon, needsReading }) => {
            const disabled = readingOff && needsReading;
            const selected = way === id;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                id={`way-${id}`}
                aria-selected={selected}
                aria-controls="way-panel"
                disabled={disabled}
                onClick={() => setChosen(id)}
                className={cn(
                  "relative flex h-10 cursor-pointer items-center justify-center gap-2 rounded-full px-3 text-sm font-semibold whitespace-nowrap transition-colors duration-300 sm:px-5",
                  selected ? "text-white" : "text-muted hover:text-hg-ink",
                  disabled && "cursor-not-allowed opacity-50 hover:text-muted",
                )}
              >
                {selected && (
                  <motion.span
                    layoutId="way-pill"
                    aria-hidden
                    className="absolute inset-0 rounded-full bg-hg-ink shadow-[0_8px_20px_-10px_rgb(11_18_32/0.6)]"
                    transition={{ duration: 0.45, ease: EASE }}
                  />
                )}
                <Icon className="relative hidden size-4 min-[400px]:block" aria-hidden />
                <span className="relative">{label}</span>
              </button>
            );
          })}
        </div>
      </StaggerItem>

      <StaggerItem>
        <div role="tabpanel" id="way-panel" aria-labelledby={`way-${way}`} className="mt-6 max-w-2xl">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={way}
              initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
              transition={{ duration: 0.3, ease: EASE }}
            >
              {way === "upload" && <UploadPanel onFiles={onFiles} />}
              {way === "sample" && <SamplePanel onSample={onSample} onAll={onAllSamples} />}
              {way === "type" && <ManualPanel onEntry={onEntry} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </StaggerItem>
    </Stagger>
  );
}
