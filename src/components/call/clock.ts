"use client";

import { useEffect, useState } from "react";
import { todayIso } from "@/lib/format";
import type { IsoDate } from "@/lib/types";

/** 402000 -> "6:42". Call time as minutes and seconds. */
export function formatClock(ms: number): string {
  const seconds = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

/**
 * Milliseconds since `startedAtMs`, ticking while `running`.
 * When it stops, the last value stays on screen, so the timer freezes at the length of the call.
 */
export function useElapsedMs(startedAtMs: number | null, running: boolean): number {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(id);
  }, [running]);

  return startedAtMs === null || now === null ? 0 : Math.max(0, now - startedAtMs);
}

/**
 * Today's calendar date in the visitor's timezone, fixed for the life of the screen.
 * Use it only in components that render after the case file is ready, so the clock is never read on the server.
 */
export function useToday(): IsoDate {
  const [today] = useState(() => todayIso());
  return today;
}
