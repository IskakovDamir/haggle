"use client";

import { useSyncExternalStore } from "react";
import { todayIso } from "@/lib/format";
import type { IsoDate } from "@/lib/types";

const noopSubscribe = () => () => undefined;
const readToday = () => todayIso();
const readHour = () => new Date().getHours();
const onServer = () => null;

/**
 * Today's date and the hour in the visitor's timezone, or null on the server and during hydration.
 * The clock is never read while the page is prerendered, so the frame can render there without a Suspense boundary.
 */
export function useClock(): { today: IsoDate; hour: number } | null {
  const today = useSyncExternalStore(noopSubscribe, readToday, onServer);
  const hour = useSyncExternalStore(noopSubscribe, readHour, onServer);
  return today === null || hour === null ? null : { today, hour };
}
