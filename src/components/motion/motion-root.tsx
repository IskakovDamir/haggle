"use client";

import { MotionConfig } from "framer-motion";

/** One place that makes every animation respect the visitor's reduced-motion setting. */
export function MotionRoot({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
