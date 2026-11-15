"use client";

// Where the judge tour stands. Kept in localStorage so it survives page loads; one window event keeps the
// guide card and the /judges page in step.
import { useSyncExternalStore } from "react";

export type TourState = {
  active: boolean;
  step: number;
  /** The last address seen for each tour page, so "Resume" goes back to the same call or result. */
  seen: Record<string, string>;
  minimized: boolean;
};

const KEY = "haggle.tour";
const EVENT = "haggle-tour";
const OFF: TourState = { active: false, step: 0, seen: {}, minimized: false };

let cachedRaw: string | null = null;
let cached: TourState = OFF;

function read(): string | null {
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

/** Parses what is stored; anything odd reads as no tour. */
function parse(raw: string | null): TourState {
  if (!raw) return OFF;
  try {
    const value = JSON.parse(raw) as Partial<TourState>;
    if (typeof value !== "object" || value === null || value.active !== true) return OFF;
    const seen: Record<string, string> = {};
    if (value.seen && typeof value.seen === "object") {
      for (const [path, href] of Object.entries(value.seen)) {
        if (typeof href === "string" && href.startsWith("/")) seen[path] = href;
      }
    }
    return {
      active: true,
      step: Number.isInteger(value.step) && (value.step as number) >= 0 ? (value.step as number) : 0,
      seen,
      minimized: value.minimized === true,
    };
  } catch {
    return OFF;
  }
}

function snapshot(): TourState {
  const raw = read();
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cached = parse(raw);
  }
  return cached;
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function write(next: TourState) {
  try {
    if (next.active) window.localStorage.setItem(KEY, JSON.stringify(next));
    else window.localStorage.removeItem(KEY);
  } catch {
    // Private mode: the tour still runs in memory for this page.
    cachedRaw = next.active ? JSON.stringify(next) : null;
    cached = next;
  }
  window.dispatchEvent(new Event(EVENT));
}

export function updateTour(change: (current: TourState) => TourState) {
  write(change(snapshot()));
}

export function startTour() {
  write({ active: true, step: 0, seen: {}, minimized: false });
}

export function endTour() {
  write(OFF);
}

export function useTour(): TourState {
  return useSyncExternalStore(subscribe, snapshot, () => OFF);
}
