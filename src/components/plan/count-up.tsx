"use client";

import { useEffect } from "react";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
import { formatDollars } from "@/lib/money";

/**
 * A dollar figure that counts up to its value once, so the headline number lands instead of just
 * appearing. Screen readers get the final figure only, and reduced-motion settings skip the count.
 */
export function CountUpDollars({ cents }: { cents: number }) {
  const still = useReducedMotion();
  const shown = useMotionValue(0);
  const text = useTransform(shown, (value) => formatDollars(value));

  useEffect(() => {
    if (still) {
      shown.set(cents);
      return;
    }
    const counting = animate(shown, cents, { duration: 0.9, ease: "easeOut" });
    return () => counting.stop();
  }, [cents, shown, still]);

  return (
    <>
      <span className="sr-only">{formatDollars(cents)}</span>
      <motion.span aria-hidden>{text}</motion.span>
    </>
  );
}
