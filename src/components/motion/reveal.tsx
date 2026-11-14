"use client";

// Motion primitives shared by the landing and the app. Server components can pass children straight through.
import { motion, type Variants } from "framer-motion";
import { cn } from "@/lib/utils";

/** The house easing: quick start, soft landing. */
export const EASE = [0.22, 1, 0.36, 1] as const;

const rise: Variants = {
  hidden: { opacity: 0, y: 24, filter: "blur(6px)" },
  shown: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.7, ease: EASE } },
};

type Tag = "div" | "section" | "li" | "ul" | "ol" | "header" | "article" | "span" | "p" | "h1" | "h2" | "h3" | "tbody" | "tr";

/** Fades and rises into place the first time it scrolls into view. */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 24,
  as = "div",
  amount = 0.2,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  delay?: number;
  y?: number;
  as?: Tag;
  amount?: number;
}) {
  const Component = motion[as];
  return (
    <Component
      className={className}
      style={style}
      initial={{ opacity: 0, y, filter: "blur(6px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, amount }}
      transition={{ duration: 0.7, ease: EASE, delay }}
    >
      {children}
    </Component>
  );
}

/** A group whose StaggerItem children rise one after another, on view or right away. */
export function Stagger({
  children,
  className,
  gap = 0.08,
  delay = 0,
  as = "div",
  onMount = false,
  amount = 0.15,
}: {
  children: React.ReactNode;
  className?: string;
  gap?: number;
  delay?: number;
  as?: Tag;
  /** Animate as soon as it mounts instead of waiting to be scrolled into view. */
  onMount?: boolean;
  amount?: number;
}) {
  const Component = motion[as];
  const variants: Variants = { hidden: {}, shown: { transition: { staggerChildren: gap, delayChildren: delay } } };
  return (
    <Component
      className={className}
      variants={variants}
      initial="hidden"
      {...(onMount ? { animate: "shown" } : { whileInView: "shown", viewport: { once: true, amount } })}
    >
      {children}
    </Component>
  );
}

export function StaggerItem({
  children,
  className,
  style,
  as = "div",
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  as?: Tag;
}) {
  const Component = motion[as];
  return (
    <Component className={className} style={style} variants={rise}>
      {children}
    </Component>
  );
}

/** Lifts a card a little on hover and presses it on tap. */
export function Lift({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      className={cn("will-change-transform", className)}
      whileHover={{ y: -4, transition: { duration: 0.25, ease: EASE } }}
      whileTap={{ scale: 0.985 }}
    >
      {children}
    </motion.div>
  );
}

/** Slow float for hero art: drifts up and down forever (off under reduced motion). */
export function Float({
  children,
  className,
  distance = 10,
  duration = 6,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  distance?: number;
  duration?: number;
  delay?: number;
}) {
  return (
    <motion.div
      className={className}
      animate={{ y: [0, -distance, 0], rotate: [0, 1.2, 0] }}
      transition={{ duration, ease: "easeInOut", repeat: Infinity, delay }}
    >
      {children}
    </motion.div>
  );
}
