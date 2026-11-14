"use client";

import { useEffect, useState } from "react";
import type { Capabilities } from "@/lib/types";

/** Is statement reading switched on? "unknown" until GET /api/config has answered. */
export type ReadingSwitch = "unknown" | "on" | "off";

/**
 * Asks the server once whether it can read statements (it needs a Claude key).
 * When the question itself fails, the answer is "on": the visitor may still try an upload, and the
 * upload will say plainly what went wrong. Claiming "not set up" without knowing would be a guess.
 */
export function useReadingSwitch(): ReadingSwitch {
  const [reading, setReading] = useState<ReadingSwitch>("unknown");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/config")
      .then((response) => (response.ok ? (response.json() as Promise<Partial<Capabilities>>) : null))
      .catch(() => null)
      .then((capabilities) => {
        if (!cancelled) setReading(capabilities?.reading === false ? "off" : "on");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return reading;
}
