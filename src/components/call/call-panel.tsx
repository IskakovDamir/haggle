"use client";

import { AnimatePresence, motion } from "framer-motion";
import { EASE } from "@/components/motion/reveal";
import type { Copy } from "@/lib/i18n/locale";
import { useLocale } from "@/lib/i18n/use-locale";
import { cn } from "@/lib/utils";
import { panel } from "./panel-theme";

export type LineState = "ready" | "connecting" | "live" | "ended";

const COPY: Copy<{ line: Record<LineState, string>; practiceWith: (callee: string) => string; callTime: string }> = {
  en: {
    line: { ready: "Ready", connecting: "Connecting", live: "Live", ended: "Ended" },
    practiceWith: (callee) => `Practice call with ${callee}`,
    callTime: "Call time",
  },
  es: {
    line: { ready: "Lista", connecting: "Conectando", live: "En vivo", ended: "Terminada" },
    practiceWith: (callee) => `Llamada de práctica con ${callee}`,
    callTime: "Duración de la llamada",
  },
};

/** Bar heights from the landing phone. They only say "on the call": they do not follow the audio. */
const WAVE = [8, 14, 22, 30, 18, 26, 34, 20, 12, 24, 30, 16, 10, 20, 14, 8];

/**
 * The phone-like panel the call happens in, drawn like the phone on the landing:
 * an ink bezel, who is on the line, the timer, a waveform while the line is open, and whatever the call shows.
 */
export function CallPanel({
  line,
  callee,
  clock,
  children,
}: {
  line: LineState;
  /** Who the agent is calling: the bank's name. */
  callee: string;
  /** Call time, already formatted. */
  clock: string;
  children: React.ReactNode;
}) {
  const open = line === "live" || line === "connecting";
  const copy = COPY[useLocale()];
  return (
    <motion.section
      aria-label={copy.practiceWith(callee)}
      className={panel.bezel}
      initial={{ opacity: 0, y: 20, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: EASE, delay: 0.1 }}
    >
      <div className={cn(panel.shell, "flex flex-col gap-4 border-0 px-4 pt-3 pb-5 sm:px-5")}>
        <div aria-hidden className="mx-auto h-[20px] w-[76px] shrink-0 rounded-full bg-hg-ink" />

        <div className="flex items-center gap-3">
          <Avatar callee={callee} line={line} />
          <div className="min-w-0 flex-1 text-[13px] leading-[18px] font-semibold">
            <p className="truncate text-[15px] leading-5 text-hg-ink">{callee}</p>
            <p className={cn("flex items-center gap-1.5", line === "live" ? "text-hg-blue" : panel.dim)}>
              <StatusDot line={line} />
              <span className="uppercase">{copy.line[line]}</span>
            </p>
          </div>
          <span
            className="tabular shrink-0 rounded-full bg-hg-surface px-3 py-1.5 text-[13px] font-semibold text-hg-ink-2"
            aria-label={copy.callTime}
          >
            {clock}
          </span>
        </div>

        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              key="wave"
              aria-hidden
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.45, ease: EASE }}
              className="overflow-hidden"
            >
              <Waveform live={line === "live"} />
            </motion.div>
          )}
        </AnimatePresence>

        {children}
      </div>
    </motion.section>
  );
}

/** The bank's initial, with soft rings: slow while connecting, a steady pulse while live. */
function Avatar({ callee, line }: { callee: string; line: LineState }) {
  const initial = callee.trim().charAt(0).toUpperCase() || "B";
  const rings = line === "connecting" ? [0, 1.2] : line === "live" ? [0] : [];
  return (
    <span
      aria-hidden
      className="relative flex size-10 shrink-0 items-center justify-center rounded-full bg-hg-ink text-[15px] font-semibold text-white"
    >
      {rings.map((delay) => (
        <motion.span
          key={`${line}:${delay}`}
          className="absolute inset-0 rounded-full border-2 border-hg-blue"
          initial={{ scale: 1, opacity: 0 }}
          animate={{ scale: [1, 1.7], opacity: [0.55, 0] }}
          transition={{ duration: line === "connecting" ? 2.4 : 1.8, ease: "easeOut", repeat: Infinity, delay }}
        />
      ))}
      {initial}
    </span>
  );
}

function StatusDot({ line }: { line: LineState }) {
  return (
    <span aria-hidden className="relative flex size-2 shrink-0">
      {line === "live" && (
        <motion.span
          className="absolute inset-0 rounded-full bg-hg-blue"
          animate={{ scale: [1, 2.6], opacity: [0.5, 0] }}
          transition={{ duration: 1.4, ease: "easeOut", repeat: Infinity }}
        />
      )}
      <motion.span
        className={cn(
          "relative size-2 rounded-full",
          line === "live" || line === "connecting" ? "bg-hg-blue" : "bg-hg-muted/60",
        )}
        animate={line === "connecting" ? { opacity: [0.35, 1, 0.35] } : { opacity: 1 }}
        transition={line === "connecting" ? { duration: 1.8, ease: "easeInOut", repeat: Infinity } : { duration: 0.3 }}
      />
    </span>
  );
}

/** The blue strip from the landing phone. Moving while live; a slow, quiet sweep while connecting. */
function Waveform({ live }: { live: boolean }) {
  return (
    <div className="flex h-[60px] items-center justify-center gap-[3px] rounded-[18px] bg-hg-blue-soft">
      {WAVE.map((height, index) => (
        <motion.span
          key={index}
          className="w-1 rounded-[2px] bg-hg-blue"
          style={{ height }}
          initial={false}
          animate={
            live
              ? { scaleY: [0.35, 1, 0.55, 0.9, 0.35], opacity: 1 }
              : { scaleY: 0.3, opacity: [0.35, 0.9, 0.35] }
          }
          transition={
            live
              ? { duration: 1.1 + (index % 5) * 0.14, ease: "easeInOut", repeat: Infinity, delay: index * 0.04 }
              : { duration: 1.8, ease: "easeInOut", repeat: Infinity, delay: index * 0.08 }
          }
        />
      ))}
    </div>
  );
}
