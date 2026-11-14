"use client";

// Small motion pieces shared by the plan and the dashboard. They only animate what the engine already worked out.
import { motion } from "framer-motion";
import { EASE } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";

/**
 * A progress bar whose fill grows to its width the first time it scrolls into view.
 * `percent` is a share the engine already gave (credit used, a success rate); it is clamped to 0–100.
 */
export function GrowBar({
  percent,
  className,
  fillClassName,
  delay = 0.15,
}: {
  percent: number;
  className?: string;
  fillClassName?: string;
  delay?: number;
}) {
  const width = `${Math.min(100, Math.max(0, percent))}%`;
  return (
    <div className={cn("h-2.5 overflow-hidden rounded-full bg-hg-blue-tint/70", className)} aria-hidden>
      <motion.div
        className={cn("h-full rounded-full bg-hg-blue", fillClassName)}
        initial={{ width: 0 }}
        whileInView={{ width }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 0.8, ease: EASE, delay }}
      />
    </div>
  );
}

/** A check mark in a blue disc: the disc scales in, then the tick draws itself. Decorative. */
export function WonCheck({ className, delay = 0 }: { className?: string; delay?: number }) {
  return (
    <motion.span
      aria-hidden
      className={cn("inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-hg-blue text-white", className)}
      initial={{ scale: 0.4, opacity: 0 }}
      whileInView={{ scale: 1, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ type: "spring", stiffness: 420, damping: 22, delay }}
    >
      <svg viewBox="0 0 24 24" fill="none" className="size-[62%]">
        <motion.path
          d="M5 12.5l4.5 4.5L19 7.5"
          stroke="currentColor"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, ease: EASE, delay: delay + 0.18 }}
        />
      </svg>
    </motion.span>
  );
}
