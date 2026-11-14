"use client";

import { useEffect, useRef, useState } from "react";
import { animate, motion, useInView, useReducedMotion } from "framer-motion";
import { EASE } from "./reveal";

/** A bar fill that grows from zero to its width the first time it scrolls into view. */
export function GrowBar({ width, className, delay = 0 }: { width: string; className?: string; delay?: number }) {
  return (
    <motion.div
      className={className}
      initial={{ width: 0 }}
      whileInView={{ width }}
      viewport={{ once: true, amount: 0.6 }}
      transition={{ duration: 1.1, ease: EASE, delay }}
    />
  );
}

/**
 * Counts the number inside a short display string ("84", "−6.3", "$1,135", "40 min") up from zero when it comes into view.
 * The server renders the final text, so the value is right with no JavaScript and for screen readers.
 */
export function CountText({ value, className, duration = 1.2 }: { value: string; className?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const reduce = useReducedMotion();
  const match = /^([^\d]*)([\d,]*\.?\d+)(.*)$/.exec(value);
  const [shown, setShown] = useState(value);

  useEffect(() => {
    if (!match || reduce || !inView) return;
    const [, prefix, digits, suffix] = match;
    const target = Number(digits.replace(/,/g, ""));
    const decimals = digits.includes(".") ? digits.split(".")[1].length : 0;
    const grouped = digits.includes(",");
    const format = (n: number) => {
      const fixed = n.toFixed(decimals);
      return grouped ? Number(fixed).toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) : fixed;
    };
    const controls = animate(0, target, {
      duration,
      ease: EASE,
      onUpdate: (n) => setShown(`${prefix}${format(n)}${suffix}`),
      onComplete: () => setShown(value),
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, reduce, value, duration]);

  return (
    <span ref={ref} className={className} aria-label={value}>
      <span aria-hidden className="tabular-nums">{shown}</span>
    </span>
  );
}
