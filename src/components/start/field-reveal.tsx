"use client";

// Fields that land one after another, so a long form reads top to bottom instead of appearing at once.
import { motion, type Variants } from "framer-motion";
import { EASE } from "@/components/motion/reveal";

/** A group (a card of fields) that rises in, then lets its fields follow in sequence. */
const groupRise: Variants = {
  hidden: { opacity: 0, y: 18 },
  shown: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE, staggerChildren: 0.045, delayChildren: 0.08 } },
};

const fieldRise: Variants = {
  hidden: { opacity: 0, y: 10 },
  shown: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE } },
};

/** Plays its children's variants in turn as soon as it mounts. */
export function RevealSequence({ children, className, gap = 0.09 }: { children: React.ReactNode; className?: string; gap?: number }) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="shown"
      variants={{ hidden: {}, shown: { transition: { staggerChildren: gap } } }}
    >
      {children}
    </motion.div>
  );
}

/** One group inside a RevealSequence. */
export function RevealGroup({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div className={className} variants={groupRise}>
      {children}
    </motion.div>
  );
}

/** One field inside a RevealGroup. */
export function RevealField({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div className={className} variants={fieldRise}>
      {children}
    </motion.div>
  );
}
