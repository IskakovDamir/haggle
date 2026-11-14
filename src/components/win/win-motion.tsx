"use client";

// The result screen plays in one order: the win, what it is worth, the receipt, and the fee last.
import { useEffect } from "react";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
import { EASE } from "@/components/motion/reveal";
import { formatCents } from "@/lib/money";

/** When each part of a win arrives, in seconds after the screen opens. */
export const BEAT = {
  card: 0,
  change: 0.35,
  strike: 0.55,
  after: 0.8,
  savings: 1,
  quote: 1.15,
  receipt: 1.15,
  pay: 1.75,
  next: 2,
  links: 2.15,
} as const;

/**
 * A cents figure that counts up to the engine's value once. It ends on exactly formatCents(cents);
 * screen readers get only that final figure, and reduced-motion settings skip the count.
 */
export function CountUpCents({ cents, delay = 0, duration = 0.8 }: { cents: number; delay?: number; duration?: number }) {
  const still = useReducedMotion();
  const shown = useMotionValue(still ? cents : 0);
  const text = useTransform(shown, (value) => formatCents(Math.round(value)));

  useEffect(() => {
    if (still) {
      shown.set(cents);
      return;
    }
    const counting = animate(shown, cents, { duration, delay, ease: EASE });
    return () => counting.stop();
  }, [cents, delay, duration, shown, still]);

  return (
    <>
      <span className="sr-only">{formatCents(cents)}</span>
      <motion.span aria-hidden className="tabular">
        {text}
      </motion.span>
    </>
  );
}

/** Rises into place after `delay`. */
export function Appear({
  delay = 0,
  y = 14,
  className,
  children,
}: {
  delay?: number;
  y?: number;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: EASE, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
