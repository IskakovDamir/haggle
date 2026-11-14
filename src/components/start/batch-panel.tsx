"use client";

import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/primitives";
import type { BatchItem } from "./batch";

const STATE_TEXT: Record<BatchItem["state"], string> = {
  reading: "Reading…",
  ready: "Read",
  failed: "Could not read",
  saved: "Added to your plan",
  skipped: "Skipped",
};

/** Every statement in the batch with where it stands. Shown while they are read and when some failed. */
export function BatchPanel({ items, onCancel, onDone }: { items: BatchItem[]; onCancel: () => void; onDone?: () => void }) {
  const reading = items.some((item) => item.state === "reading");

  return (
    <div>
      <h1 className="text-3xl leading-[1.1] font-extrabold sm:text-[2.75rem]">
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
      <p className="mt-3 max-w-[60ch] text-lg text-muted">
        {reading
          ? "Each one is read the same way, a few seconds apiece. You will check every card before anything is saved."
          : "You can upload those again, or type their numbers in."}
      </p>

      <Card className="mt-8 divide-y divide-line">
        {items.map((item) => (
          <div key={item.key} className="flex items-start gap-3 p-4 sm:p-5" aria-live="polite">
            {item.state === "reading" && <Loader2 className="mt-0.5 size-5 shrink-0 animate-spin text-muted" aria-hidden />}
            {(item.state === "ready" || item.state === "saved") && (
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-green" aria-hidden />
            )}
            {(item.state === "failed" || item.state === "skipped") && (
              <XCircle className="mt-0.5 size-5 shrink-0 text-muted" aria-hidden />
            )}
            <div className="min-w-0">
              <p className="truncate font-semibold">{item.label}</p>
              <p className="text-sm text-muted">{item.state === "failed" && item.message ? item.message : STATE_TEXT[item.state]}</p>
            </div>
          </div>
        ))}
      </Card>

      <div className="mt-6 flex flex-wrap gap-3">
        {!reading && onDone && <Button size="lg" onClick={onDone}>Go to your plan</Button>}
        <Button variant={reading ? "outline" : "ghost"} size="lg" onClick={onCancel}>
          {reading ? "Cancel" : "Add statements again"}
        </Button>
      </div>
    </div>
  );
}
