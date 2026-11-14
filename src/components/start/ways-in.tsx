"use client";

import { useState } from "react";
import { FileText, FileUp, Keyboard, type LucideIcon } from "lucide-react";
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
    <div>
      <h1 className="text-3xl leading-[1.1] font-extrabold sm:text-[2.75rem]">
        Bring in your <em>statements</em>
      </h1>
      <p className="mt-3 max-w-[60ch] text-lg text-muted">
        One statement is enough to start. Add every card you have, from every bank, and Haggle builds one plan and one list of calls.
      </p>

      {readingOff && (
        <p className="mt-6 rounded-2xl border border-line bg-card p-4 text-sm">
          Statement reading is not set up on this server, so uploads and sample statements are switched off. Typing the
          numbers works, and so does everything after it.
        </p>
      )}
      {problem && (
        <p role="alert" className="mt-6 rounded-2xl border border-alarm/30 bg-alarm-soft p-4 text-sm text-alarm">
          {problem}
        </p>
      )}

      <div role="tablist" aria-label="How to add a statement" className="mt-6 grid grid-cols-3 gap-1 rounded-full bg-ink/7 p-1 sm:inline-grid">
        {WAYS.map(({ id, label, icon: Icon, needsReading }) => {
          const disabled = readingOff && needsReading;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              id={`way-${id}`}
              aria-selected={way === id}
              aria-controls="way-panel"
              disabled={disabled}
              onClick={() => setChosen(id)}
              className={cn(
                "flex h-10 cursor-pointer items-center justify-center gap-2 rounded-full px-3 text-sm font-medium whitespace-nowrap transition-colors sm:px-5",
                way === id ? "bg-card text-ink shadow-sm" : "text-muted hover:text-ink",
                disabled && "cursor-not-allowed opacity-50 hover:text-muted",
              )}
            >
              <Icon className="hidden size-4 min-[400px]:block" aria-hidden />
              {label}
            </button>
          );
        })}
      </div>

      <div role="tabpanel" id="way-panel" aria-labelledby={`way-${way}`} className="mt-5 max-w-2xl">
        {way === "upload" && <UploadPanel onFiles={onFiles} />}
        {way === "sample" && <SamplePanel onSample={onSample} onAll={onAllSamples} />}
        {way === "type" && <ManualPanel onEntry={onEntry} />}
      </div>
    </div>
  );
}
