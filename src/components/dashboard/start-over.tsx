"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Clears the case from this browser, after the visitor confirms. */
export function StartOver({ onClear }: { onClear: () => void }) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <Button variant="ghost" className="text-muted" onClick={() => setConfirming(true)}>
        <RotateCcw className="size-4" aria-hidden />
        Start over
      </Button>
    );
  }

  return (
    <div role="alertdialog" aria-labelledby="start-over-question" className="rounded-2xl border border-alarm/30 bg-alarm-soft p-5">
      <p id="start-over-question" className="font-semibold text-alarm">
        Clear everything?
      </p>
      <p className="mt-1 text-sm">
        This removes your cards, calls and results from this browser. It cannot be undone.
      </p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Button variant="danger" onClick={onClear}>
          Yes, clear it
        </Button>
        <Button variant="outline" onClick={() => setConfirming(false)}>
          Keep my case
        </Button>
      </div>
    </div>
  );
}
