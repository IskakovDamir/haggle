"use client";

import { useEffect } from "react";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
import { EASE } from "@/components/motion/reveal";
import { formatCents, formatDollars } from "@/lib/money";

/** How the counting figure is written. The final text is always the same formatter the static screen uses. */
const FORMATS = {
  dollars: (cents: number) => formatDollars(Math.round(cents)),
  cents: (cents: number) => formatCents(Math.round(cents)),
  percent: (value: number) => `${Math.round(value)}%`,
} as const;

/**
 * A figure that counts up to its value once, so a headline number lands instead of just appearing.
 * The value comes from the engine; this only animates the way it is written. Screen readers get the
 * final figure only, and reduced-motion settings skip the count.
 */
export function CountUp({
  value,
  format,
  duration = 0.9,
  delay = 0,
}: {
  value: number;
  format: keyof typeof FORMATS;
  duration?: number;
  delay?: number;
}) {
  const still = useReducedMotion();
  const shown = useMotionValue(0);
  const write = FORMATS[format];
  const text = useTransform(shown, (current) => write(current));

  useEffect(() => {
    if (still) {
      shown.set(value);
      return;
    }
    const counting = animate(shown, value, { duration, delay, ease: EASE });
    return () => counting.stop();
  }, [value, shown, still, duration, delay]);

  return (
    <>
      <span className="sr-only">{write(value)}</span>
      <motion.span aria-hidden>{text}</motion.span>
    </>
  );
}

/** The headline's dollar figure. */
export function CountUpDollars({ cents }: { cents: number }) {
  return <CountUp value={cents} format="dollars" />;
}
