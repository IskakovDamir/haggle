"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Ban, LoaderCircle, Mic, MicOff, Quote } from "lucide-react";
import { EASE } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { formatApr } from "@/lib/format";
import type { Copy, Locale } from "@/lib/i18n/locale";
import { useLocale } from "@/lib/i18n/use-locale";
import { formatShort } from "@/lib/money";
import type { CoachOffer, CoachStage, NegotiationBrief, Turn } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Notice } from "./page-states";
import { panel } from "./panel-theme";
import { useCoach } from "./use-coach";

type CoachCopy = {
  intro: (bank: string, handoff: boolean) => string;
  privacy: string;
  start: string;
  starting: string;
  listening: string;
  paused: string;
  pause: string;
  resume: string;
  sayThis: string;
  justListen: string;
  avoid: string;
  thinking: string;
  heard: string;
  nothingYet: string;
  offerLabel: Record<CoachOffer["kind"], string>;
  verdict: (offer: CoachOffer, brief: NegotiationBrief) => string;
  stage: Record<CoachStage, string>;
};

const COPY: Copy<CoachCopy> = {
  en: {
    intro: (bank, handoff) =>
      handoff
        ? `You're on with ${bank} now. Put your phone on speaker next to this screen and turn on the coach. It listens and shows you what to say next.`
        : `Call ${bank} yourself, on speaker, next to this screen. Turn on the coach and it shows you what to say next.`,
    privacy: "Audio goes to our speech provider only while the coach is on. Tips stick to the facts on your statement.",
    start: "Turn on the coach",
    starting: "Starting. Allow the microphone if your browser asks.",
    listening: "Listening",
    paused: "Paused",
    pause: "Pause",
    resume: "Resume",
    sayThis: "Say this",
    justListen: "Just listen for now.",
    avoid: "Avoid",
    thinking: "Thinking",
    heard: "What the coach hears",
    nothingYet: "Nothing heard yet.",
    offerLabel: { apr: "APR", late_fee_refund: "Late fee refund", interest_refund: "Interest refund", other_credit: "Credit" },
    verdict: (offer, brief) => {
      if (offer.verdict === "good") return "Meets your ask";
      if (offer.verdict === "no_better") return "Not lower than today";
      if (offer.verdict === "counter" && brief.askAprBps !== null) return `Counter: you asked for ${formatApr(brief.askAprBps)}`;
      return "Heard";
    },
    stage: { opening: "Opening", asking: "Asking", counter: "Counter", accept: "Lock it in", wrap_up: "Wrap up", listen: "Listen" },
  },
  es: {
    intro: (bank, handoff) =>
      handoff
        ? `Ya estás con ${bank}. Pon tu teléfono en altavoz junto a esta pantalla y enciende el coach. Escucha y te muestra qué decir.`
        : `Llama tú a ${bank}, en altavoz, junto a esta pantalla. Enciende el coach y te muestra qué decir.`,
    privacy: "El audio va a nuestro proveedor de voz solo mientras el coach está encendido. Los consejos se basan en tu estado de cuenta.",
    start: "Encender el coach",
    starting: "Iniciando. Permite el micrófono si tu navegador lo pide.",
    listening: "Escuchando",
    paused: "En pausa",
    pause: "Pausar",
    resume: "Seguir",
    sayThis: "Di esto",
    justListen: "Por ahora, solo escucha.",
    avoid: "Evita",
    thinking: "Pensando",
    heard: "Lo que escucha el coach",
    nothingYet: "Aún no se escucha nada.",
    offerLabel: { apr: "APR", late_fee_refund: "Reembolso del cargo", interest_refund: "Reembolso de intereses", other_credit: "Crédito" },
    verdict: (offer, brief) => {
      if (offer.verdict === "good") return "Cumple lo que pediste";
      if (offer.verdict === "no_better") return "No es más bajo que hoy";
      if (offer.verdict === "counter" && brief.askAprBps !== null) return `Contraoferta: pediste ${formatApr(brief.askAprBps)}`;
      return "Escuchado";
    },
    stage: { opening: "Inicio", asking: "Pedir", counter: "Contraoferta", accept: "Cerrar", wrap_up: "Despedida", listen: "Escuchar" },
  },
};

const offerFigure = (offer: CoachOffer) => (offer.kind === "apr" ? formatApr(offer.value) : formatShort(offer.value));

/**
 * Live tips for a cardholder who is talking to the bank themselves: after the agent handed them the
 * call, or on a call they placed on their own. Nothing here is counted as a win or charged for.
 */
export function CoachPanel(props: {
  brief: NegotiationBrief;
  /** The call so far, when the agent spoke first. */
  earlier: Turn[];
  handoff: boolean;
  footer: React.ReactNode;
}) {
  const { brief, earlier, handoff, footer } = props;
  const locale: Locale = useLocale();
  const copy = COPY[locale];
  const coach = useCoach({ brief, earlier });
  const { status, tip } = coach;
  const on = status === "listening";
  const started = status !== "off" || tip !== null || coach.lines.length > 0;

  return (
    <div className="flex flex-col gap-4">
      {!started ? (
        <div className="flex flex-col gap-4 rounded-[20px] bg-hg-blue-soft p-5">
          <p className="text-[17px] leading-7 font-semibold text-hg-ink">{copy.intro(brief.issuerName, handoff)}</p>
          <p className={cn("text-sm leading-6", panel.dim)}>{copy.privacy}</p>
          <Button size="lg" onClick={coach.start}>
            <Mic className="size-4" aria-hidden />
            {copy.start}
          </Button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between gap-3">
            <p role="status" className="flex items-center gap-2.5 text-sm font-semibold text-hg-ink-2">
              <span aria-hidden className="relative flex size-2.5">
                {on && (
                  <motion.span
                    className="absolute inset-0 rounded-full bg-hg-blue"
                    animate={{ scale: [1, 2.4], opacity: [0.5, 0] }}
                    transition={{ duration: 1.4, ease: "easeOut", repeat: Infinity }}
                  />
                )}
                <span className={cn("relative size-2.5 rounded-full", on ? "bg-hg-blue" : "bg-hg-muted")} />
              </span>
              {status === "starting" ? copy.starting : on ? copy.listening : copy.paused}
              {tip && (
                <span className="rounded-full bg-hg-surface px-2.5 py-0.5 text-xs font-semibold text-hg-muted">
                  {copy.stage[tip.stage]}
                </span>
              )}
            </p>
            {status !== "starting" && (
              <Button variant="ghost" size="sm" onClick={on ? coach.stop : coach.start}>
                {on ? <MicOff className="size-3.5" aria-hidden /> : <Mic className="size-3.5" aria-hidden />}
                {on ? copy.pause : copy.resume}
              </Button>
            )}
          </div>

          <TipCard copy={copy} coach={coach} />

          {tip && tip.offers.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {tip.offers.map((offer) => (
                <motion.li
                  key={`${offer.kind}-${offer.value}`}
                  initial={{ opacity: 0, scale: 0.94 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, ease: EASE }}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-[13px] font-semibold",
                    offer.verdict === "good" && "border-green/25 bg-green-soft text-green",
                    offer.verdict === "counter" && "border-hg-blue-tint bg-hg-blue-soft text-hg-blue",
                    offer.verdict === "no_better" && "border-leak/20 bg-leak-soft text-[#a83a12]",
                    offer.verdict === "heard" && "border-line bg-hg-surface text-hg-ink-2",
                  )}
                >
                  {copy.offerLabel[offer.kind]} {offerFigure(offer)} · {copy.verdict(offer, brief)}
                </motion.li>
              ))}
            </ul>
          )}

          <Heard copy={copy} lines={coach.lines} partial={coach.partial} />
        </>
      )}

      {coach.error && <Notice tone="dark">{coach.error}</Notice>}
      {footer}
    </div>
  );
}

function TipCard({ copy, coach }: { copy: CoachCopy; coach: ReturnType<typeof useCoach> }) {
  const { tip, thinking } = coach;
  return (
    <div className="relative overflow-hidden rounded-[20px] border border-hg-blue-tint bg-white p-5 shadow-[0_18px_40px_-28px_rgb(47_107_255/0.6)]">
      <div className="mb-2 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs font-bold tracking-[0.08em] text-hg-blue uppercase">
          <Quote className="size-3.5" aria-hidden />
          {copy.sayThis}
        </span>
        {thinking && (
          <span className={cn("flex items-center gap-1.5 text-xs font-semibold", panel.dim)}>
            <LoaderCircle className="size-3.5 animate-spin" aria-hidden />
            {copy.thinking}
          </span>
        )}
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={tip ? `${tip.say}|${tip.why}` : "waiting"}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.28, ease: EASE }}
          aria-live="polite"
        >
          {tip ? (
            <>
              <p className="text-[clamp(19px,2.4vw,23px)] leading-snug font-semibold tracking-[-0.01em] text-hg-ink">
                {tip.say !== "" ? `“${tip.say}”` : copy.justListen}
              </p>
              {tip.why !== "" && <p className={cn("mt-2 text-sm leading-6", panel.dim)}>{tip.why}</p>}
              {tip.avoid && (
                <p className="mt-3 flex items-start gap-2 rounded-xl bg-leak-soft px-3 py-2 text-sm leading-5 text-[#a83a12]">
                  <Ban className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                  <span>
                    <span className="font-semibold">{copy.avoid}:</span> {tip.avoid}
                  </span>
                </p>
              )}
            </>
          ) : (
            <div className="space-y-2" aria-hidden>
              <div className="hg-shimmer h-6 w-4/5 rounded-lg" />
              <div className="hg-shimmer h-6 w-3/5 rounded-lg" />
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/** The last few lines the microphone heard, newest at the bottom, with the line still being said. */
function Heard({ copy, lines, partial }: { copy: CoachCopy; lines: string[]; partial: string }) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (box.current) box.current.scrollTop = box.current.scrollHeight;
  }, [lines.length, partial]);
  const recent = lines.slice(-8);
  return (
    <div className="rounded-[20px] bg-hg-surface p-4">
      <p className="mb-2 text-xs font-bold tracking-[0.08em] text-hg-muted uppercase">{copy.heard}</p>
      <div ref={box} className="max-h-40 space-y-1.5 overflow-y-auto text-[14px] leading-6 text-hg-ink-2">
        {recent.length === 0 && partial === "" && <p className={panel.dim}>{copy.nothingYet}</p>}
        {recent.map((line, index) => (
          <p key={lines.length - recent.length + index}>{line}</p>
        ))}
        {partial !== "" && <p className={cn("italic", panel.dim)}>{partial}</p>}
      </div>
    </div>
  );
}
