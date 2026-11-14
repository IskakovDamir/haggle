"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EASE } from "@/components/motion/reveal";

/** Clears the case from this browser, after the visitor confirms. */
export function StartOver({ onClear }: { onClear: () => void }) {
  const [confirming, setConfirming] = useState(false);

  return (
    <AnimatePresence mode="wait" initial={false}>
      {confirming ? (
        <motion.div
          key="confirming"
          role="alertdialog"
          aria-labelledby="start-over-question"
          className="rounded-[24px] border border-alarm/25 bg-alarm-soft p-5 sm:p-6"
          initial={{ opacity: 0, y: 8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.98 }}
          transition={{ duration: 0.3, ease: EASE }}
        >
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
        </motion.div>
      ) : (
        <motion.div
          key="idle"
          className="w-fit"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: EASE }}
        >
          <Button variant="ghost" className="text-muted" onClick={() => setConfirming(true)}>
            <RotateCcw className="size-4" aria-hidden />
            Start over
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
