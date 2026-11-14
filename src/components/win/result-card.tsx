"use client";

import { ArrowRight, Quote } from "lucide-react";
import { motion } from "framer-motion";
import { EASE } from "@/components/motion/reveal";
import type { Copy } from "@/lib/i18n/locale";
import { useLocale } from "@/lib/i18n/use-locale";
import type { CallOutcome, Savings } from "@/lib/types";
import { cn } from "@/lib/utils";
import type { Change } from "./changes";
import { Appear, BEAT, CountUpCents } from "./win-motion";

type ResultCopy = {
  badge: (partial: boolean) => string;
  said: string;
  yes: (partial: boolean) => string;
  to: string;
  saves: string;
  savesTail: string;
  noDollars: string;
  quoteCaption: string;
};

const COPY: Copy<ResultCopy> = {
  en: {
    badge: (partial) => `${partial ? "Partial win" : "Win"} · practice call`,
    said: "said",
    yes: (partial) => (partial ? "yes to part of it" : "yes"),
    to: " to ",
    saves: "Saves",
    savesTail: "in the first year · one card · one call",
    noDollars: "This win is not counted in dollars, so there is no fee.",
    quoteCaption: "The bank's own words on the call. Code checked every number against them.",
  },
  es: {
    badge: (partial) => `${partial ? "Victoria parcial" : "Victoria"} · llamada de práctica`,
    said: "dijo",
    yes: (partial) => (partial ? "que sí a una parte" : "que sí"),
    to: " a ",
    saves: "Ahorra",
    savesTail: "el primer año · una tarjeta · una llamada",
    noDollars: "Esta victoria no se cuenta en dólares, así que no hay cargo.",
    quoteCaption: "Las propias palabras del banco en la llamada. El código revisó cada número con ellas.",
  },
};

/** The muted second voice of a heading, made light so it reads on the blue panel. */
const onBlueEm = { color: "rgb(255 255 255 / 0.68)" } as const;

/**
 * "APR 27.24% -> 19.99%", read out as "APR 27.24% to 19.99%".
 * The old value is struck through, the arrow slides in, and the new value lands last.
 */
function ChangeLine({ change, big, order }: { change: Change; big: boolean; order: number }) {
  const step = order * 0.12;
  const copy = COPY[useLocale()];
  return (
    <motion.p
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE, delay: BEAT.change + step }}
      className={
        big
          ? "tabular text-[clamp(1.75rem,7vw,3.5rem)] leading-[1.05] font-semibold tracking-[-0.035em]"
          : "tabular text-lg font-semibold tracking-[-0.01em] sm:text-xl"
      }
    >
      <span className={cn(big && "text-white/80")}>{change.label}</span>{" "}
      {change.before !== null && (
        <>
          <span className="relative inline-block opacity-55">
            {change.before}
            <motion.span
              aria-hidden
              className="absolute top-1/2 -right-[4%] -left-[4%] h-[0.07em] min-h-[2px] -translate-y-1/2 rounded-full bg-white"
              style={{ originX: 0 }}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.45, ease: EASE, delay: BEAT.strike + step }}
            />
          </span>
          <motion.span
            aria-hidden
            className="inline-block"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, ease: EASE, delay: BEAT.strike + 0.15 + step }}
          >
            <ArrowRight className="mx-1.5 inline size-[0.7em] align-baseline" />
          </motion.span>
          <span className="sr-only">{copy.to}</span>
        </>
      )}
      <motion.span
        className="inline-block whitespace-nowrap"
        style={{ originX: 0, originY: 1 }}
        initial={{ opacity: 0, y: 8, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: EASE, delay: BEAT.after + step }}
      >
        {change.after}
      </motion.span>
    </motion.p>
  );
}

/** The blue card for a confirmed win: before and after, what it is worth, and the bank's words behind it. */
export function ResultCard({
  bankName,
  outcome,
  changes,
  savings,
}: {
  bankName: string;
  outcome: CallOutcome;
  changes: Change[];
  savings: Savings;
}) {
  const [headline, ...rest] = changes;
  const quote = outcome.evidence[0]?.quote ?? null;
  const copy = COPY[useLocale()];
  const partial = outcome.result === "partial";

  return (
    <motion.section
      initial={{ opacity: 0, y: 18, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: EASE, delay: BEAT.card }}
      className="hg-panel relative isolate overflow-hidden rounded-[32px] p-6 shadow-[0_30px_70px_-34px_rgb(31_79_216/0.75)] sm:p-10"
    >
      {/* Soft light in the corners, as on the landing's blue panels, and one sweep of shine as the win lands. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 -right-24 size-[26rem] rounded-full bg-white/12 blur-3xl" />
        <div className="absolute -bottom-40 -left-28 size-[22rem] rounded-full bg-[#7fa6ff]/25 blur-3xl" />
        <motion.div
          className="absolute inset-y-0 left-0 w-1/3 -skew-x-12 bg-linear-to-r from-transparent via-white/14 to-transparent"
          initial={{ x: "-150%" }}
          animate={{ x: "400%" }}
          transition={{ duration: 1.2, ease: EASE, delay: BEAT.after + 0.1 }}
        />
      </div>

      <Appear delay={0.1} y={8}>
        <p className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-semibold tracking-widest uppercase ring-1 ring-white/20">
          {copy.badge(partial)}
        </p>
      </Appear>
      <Appear delay={0.18} y={10}>
        <h1 className="mt-3 text-[clamp(26px,3.6vw,36px)] leading-[1.15] font-semibold tracking-[-0.035em]">
          {bankName} {copy.said} <em style={onBlueEm}>{copy.yes(partial)}</em>
        </h1>
      </Appear>

      <div className="mt-6 flex flex-col gap-2">
        {headline && <ChangeLine change={headline} big order={0} />}
        {rest.map((change, index) => (
          <ChangeLine key={change.label} change={change} big={false} order={index + 1} />
        ))}
      </div>

      <Appear delay={BEAT.savings} y={10}>
        <p className="mt-6 inline-block rounded-2xl bg-white/14 px-4 py-2.5 font-semibold text-white/85 ring-1 ring-white/20 sm:rounded-full">
          {savings.annualSavingsCents > 0 ? (
            <>
              {copy.saves}{" "}
              <span className="text-white">
                <CountUpCents cents={savings.annualSavingsCents} delay={BEAT.savings + 0.1} />
              </span>{" "}
              {copy.savesTail}
            </>
          ) : (
            copy.noDollars
          )}
        </p>
      </Appear>

      {quote && (
        <Appear delay={BEAT.quote} y={10}>
          <figure className="mt-7 flex gap-3 border-t border-white/20 pt-5">
            <Quote className="mt-0.5 size-5 shrink-0 opacity-60" aria-hidden />
            <div>
              <blockquote className="text-xl leading-snug font-semibold tracking-[-0.02em] sm:text-2xl">{quote}</blockquote>
              <figcaption className="mt-1.5 text-sm text-white/70">
                {copy.quoteCaption}
              </figcaption>
            </div>
          </figure>
        </Appear>
      )}
    </motion.section>
  );
}
