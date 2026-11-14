"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, LoaderCircle, Mic, PhoneOff, SendHorizontal, Smartphone } from "lucide-react";
import { EASE } from "@/components/motion/reveal";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/primitives";
import type { Copy } from "@/lib/i18n/locale";
import { useLocale } from "@/lib/i18n/use-locale";
import { cn } from "@/lib/utils";
import { Notice } from "./page-states";
import { panel } from "./panel-theme";
import type { CallSession } from "./use-call-session";

/** The longest line the negotiate route accepts. */
const MAX_LINE_CHARS = 1000;

type PhoneStatus = CallSession["phone"]["status"];

type LiveCopy = {
  seeResult: string;
  callAgain: string;
  readAgain: string;
  reading: string;
  tryAgain: string;
  voiceFailed: string;
  carryOn: string;
  typeInstead: string;
  micOn: string;
  connecting: string;
  stopFollowing: string;
  endCall: string;
  phoneLine: Record<PhoneStatus, string>;
  /** The agent handed the call to the cardholder and left. */
  transferred: string;
  lineLabel: string;
  suggested: string;
  scriptTitle: string;
  scriptNote: string;
  handoffLine: string;
  answer: string;
  wait: string;
  send: string;
};

const COPY: Copy<LiveCopy> = {
  en: {
    seeResult: "See the result",
    callAgain: "Call again",
    readAgain: "Read the call again",
    reading: "Reading the call. Every number is checked against the bank's own words.",
    tryAgain: "Try again",
    voiceFailed: "The voice call could not start.",
    carryOn: "You can carry on by typing.",
    typeInstead: "Type instead",
    micOn: "The microphone is on. Speak as the bank.",
    connecting: "Connecting the call. Allow the microphone if your browser asks.",
    stopFollowing: "Stop following and read the call",
    endCall: "End call",
    phoneLine: {
      idle: "Getting ready to call.",
      placing: "Placing the call.",
      dialing: "Ringing your phone. Pick up and play the bank.",
      live: "You are on the call. Speak as the bank, and hang up when you are done.",
      wrapping: "The call ended. Getting the full transcript.",
      done: "The call ended.",
      failed: "The call did not connect.",
    },
    transferred: "The bank asked for the cardholder. The agent connected them and left the call.",
    lineLabel: "Your line, as the bank",
    suggested: "Tap a reply, or type your own",
    scriptTitle: "Your script as the bank",
    scriptNote: "Say these in your own words, in any order. Or go off script: the agent never invents facts, and the result counts only what you say.",
    handoffLine: "Actually, I need to speak with the cardholder directly.",
    answer: "Answer as the bank",
    wait: "Wait for the agent",
    send: "Say it",
  },
  es: {
    seeResult: "Ver el resultado",
    callAgain: "Llamar otra vez",
    readAgain: "Leer la llamada otra vez",
    reading: "Leyendo la llamada. Cada número se revisa con las propias palabras del banco.",
    tryAgain: "Intentar de nuevo",
    voiceFailed: "No se pudo iniciar la llamada de voz.",
    carryOn: "Puedes seguir por escrito.",
    typeInstead: "Escribir mejor",
    micOn: "El micrófono está encendido. Habla como el banco.",
    connecting: "Conectando la llamada. Permite el micrófono si tu navegador lo pide.",
    stopFollowing: "Dejar de seguir y leer la llamada",
    endCall: "Terminar llamada",
    phoneLine: {
      idle: "Preparando la llamada.",
      placing: "Haciendo la llamada.",
      dialing: "Está sonando tu teléfono. Contesta y haz de banco.",
      live: "Estás en la llamada. Habla como el banco y cuelga cuando termines.",
      wrapping: "La llamada terminó. Obteniendo la transcripción completa.",
      done: "La llamada terminó.",
      failed: "La llamada no se conectó.",
    },
    transferred: "El banco pidió hablar con el titular. El agente lo conectó y salió de la llamada.",
    lineLabel: "Lo que dices, como el banco",
    suggested: "Toca una respuesta o escribe la tuya",
    scriptTitle: "Tu guion como banco",
    scriptNote: "Dilo con tus palabras, en el orden que quieras. O improvisa: el agente nunca inventa datos y el resultado cuenta solo lo que tú digas.",
    handoffLine: "En realidad, necesito hablar directamente con el titular.",
    answer: "Responde como el banco",
    wait: "Espera al agente",
    send: "Enviar",
  },
};

/** Each phase of the row rises in when it takes over, so the change reads as one step. */
function Phase({ id, className, children }: { id: string; className?: string; children: React.ReactNode }) {
  return (
    <motion.div
      key={id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** The row under the transcript. It changes with the call: speak or type, wait for the result, or move on. */
export function LiveControls({ session, replies = [] }: { session: CallSession; replies?: string[] }) {
  const { phase, mode, problem, voice } = session;
  const copy = COPY[useLocale()];

  if (phase === "done") {
    return (
      <Phase id="done" className="flex flex-col gap-2 sm:flex-row">
        <Link
          href={`/win?call=${encodeURIComponent(session.callId ?? "")}`}
          className={cn(buttonVariants({ size: "lg" }), "group flex-1")}
        >
          {copy.seeResult}
          <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
        </Link>
        <Button size="lg" variant="ghost" onClick={session.reset}>
          {copy.callAgain}
        </Button>
      </Phase>
    );
  }

  if (phase === "reading") {
    return problem ? (
      <Phase id="reading-problem" className="flex flex-col gap-3">
        <Notice tone="dark">{problem.message}</Notice>
        <Button size="lg" onClick={session.retry}>
          {copy.readAgain}
        </Button>
      </Phase>
    ) : (
      <Phase id="reading">
        <p
          role="status"
          className="hg-shimmer flex items-center gap-2.5 rounded-2xl px-4 py-3 text-[15px] font-medium text-hg-ink-2"
        >
          <LoaderCircle className="size-4 shrink-0 animate-spin text-hg-blue" aria-hidden />
          {copy.reading}
        </p>
      </Phase>
    );
  }

  const voiceFailed = mode === "voice" && (voice.status === "error" || voice.status === "unavailable");
  const micLive = voice.status === "live";

  return (
    <Phase id="live" className="flex flex-col gap-3">
      {problem && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Notice tone="dark" className="flex-1">
            {problem.message}
          </Notice>
          <Button variant="outline" onClick={session.retry}>
            {copy.tryAgain}
          </Button>
        </div>
      )}

      {voiceFailed && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Notice tone="dark" className="flex-1">
            {voice.error ?? copy.voiceFailed} {copy.carryOn}
          </Notice>
          <Button variant="outline" onClick={session.typeInstead}>
            {copy.typeInstead}
          </Button>
        </div>
      )}

      {mode === "text" && <BankComposer session={session} replies={replies} />}

      {mode === "phone" && <PhoneLine status={session.phone.status} transferred={session.phone.transferred} />}

      {mode === "phone" && !session.phone.transferred && ["placing", "dialing", "live"].includes(session.phone.status) && (
        <PhoneScript replies={replies} withCardholder={session.phone.withCardholder} />
      )}

      {mode === "voice" && !voiceFailed && (
        <p role="status" className={cn("flex items-center gap-3 text-[15px] font-medium", micLive ? "text-hg-ink-2" : panel.dim)}>
          <span
            aria-hidden
            className={cn(
              "relative flex size-9 shrink-0 items-center justify-center rounded-full transition-colors duration-300",
              micLive ? "bg-hg-blue text-white" : "bg-hg-blue-soft text-hg-blue",
            )}
          >
            {micLive && (
              <motion.span
                className="absolute inset-0 rounded-full bg-hg-blue"
                animate={{ scale: [1, 1.6], opacity: [0.35, 0] }}
                transition={{ duration: 1.6, ease: "easeOut", repeat: Infinity }}
              />
            )}
            <Mic className="relative size-4" />
          </span>
          {micLive ? copy.micOn : copy.connecting}
        </p>
      )}

      {mode === "phone" ? (
        <Button variant="outline" size="lg" onClick={session.end}>
          {copy.stopFollowing}
        </Button>
      ) : (
        <Button variant="danger" size="lg" onClick={session.end}>
          <PhoneOff className="size-4" aria-hidden />
          {copy.endCall}
        </Button>
      )}
    </Phase>
  );
}

/** Where a phone call stands. The phone itself is the microphone, so this row only reports. */
function PhoneLine({ status, transferred }: { status: PhoneStatus; transferred: boolean }) {
  const copy = COPY[useLocale()];
  const ringing = status === "placing" || status === "dialing";
  const live = status === "live";
  return (
    <p role="status" className={cn("flex items-center gap-3 text-[15px] font-medium", live ? "text-hg-ink-2" : panel.dim)}>
      <span
        aria-hidden
        className={cn(
          "relative flex size-9 shrink-0 items-center justify-center rounded-full transition-colors duration-300",
          live ? "bg-hg-blue text-white" : "bg-hg-blue-soft text-hg-blue",
        )}
      >
        {(ringing || live) && (
          <motion.span
            className="absolute inset-0 rounded-full bg-hg-blue"
            animate={{ scale: [1, ringing ? 1.9 : 1.6], opacity: [0.35, 0] }}
            transition={{ duration: ringing ? 1.1 : 1.6, ease: "easeOut", repeat: Infinity }}
          />
        )}
        <motion.span
          className="relative"
          animate={ringing ? { rotate: [0, -14, 14, -10, 10, 0] } : { rotate: 0 }}
          transition={ringing ? { duration: 0.7, repeat: Infinity, repeatDelay: 0.6 } : { duration: 0.2 }}
        >
          <Smartphone className="size-4" />
        </motion.span>
      </span>
      {transferred && status === "live" ? copy.transferred : copy.phoneLine[status]}
    </p>
  );
}

/** What the visitor can say as the bank on a phone call: the same lines as the typed call's replies. */
function PhoneScript({ replies, withCardholder }: { replies: string[]; withCardholder: boolean }) {
  const copy = COPY[useLocale()];
  if (replies.length === 0) return null;
  // The handoff line goes right after the bank's first question, where a real rep would ask for it.
  const lines = withCardholder ? [replies[0], copy.handoffLine, ...replies.slice(1)] : replies;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: EASE }}
      className="rounded-2xl border border-line bg-hg-surface p-4"
    >
      <p className={cn("text-[11px] font-semibold tracking-[0.08em] uppercase", panel.dim)}>{copy.scriptTitle}</p>
      <ol className="mt-2.5 flex flex-col gap-2">
        {lines.map((line, index) => (
          <li
            key={line}
            className={cn(
              "flex items-start gap-2.5 text-[14px] leading-snug",
              line === copy.handoffLine ? "font-semibold text-hg-blue" : "text-hg-ink-2",
            )}
          >
            <span className="mt-px flex size-5 shrink-0 items-center justify-center rounded-full bg-white text-[11px] font-bold text-hg-muted">
              {index + 1}
            </span>
            “{line}”
          </li>
        ))}
      </ol>
      <p className={cn("mt-3 text-xs leading-5", panel.dim)}>{copy.scriptNote}</p>
    </motion.div>
  );
}

/** Where the visitor types the bank's next line. It opens only when it is the bank's turn to speak. */
function BankComposer({ session, replies }: { session: CallSession; replies: string[] }) {
  const [draft, setDraft] = useState("");
  const copy = COPY[useLocale()];
  const banksTurn = !session.agentIsReplying && session.turns.at(-1)?.role === "agent";
  const canSend = banksTurn && draft.trim() !== "";
  // The suggested lines not said yet, next ones first. The last two (confirm, goodbye) stay on offer,
  // since the agent may ask to confirm the terms more than once, until the goodbye is said.
  const said = new Set(session.turns.filter((turn) => turn.role === "bank").map((turn) => turn.text));
  const closing = replies.slice(-2);
  const steps = replies.slice(0, -2).filter((reply) => !said.has(reply)).slice(0, 2);
  const next = closing.length === 2 && said.has(closing[1]) ? [] : [...steps, ...closing];

  return (
    <div className="flex flex-col gap-2.5">
      {next.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className={cn("text-[11px] font-semibold tracking-[0.08em] uppercase", panel.dim)}>{copy.suggested}</p>
          <div className="flex flex-wrap gap-2">
            {next.map((reply, index) => (
              <motion.button
                key={reply}
                type="button"
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: EASE }}
                disabled={!banksTurn}
                onClick={() => session.say(reply)}
                className={cn(
                  "rounded-2xl border px-3.5 py-2 text-left text-[14px] leading-snug font-medium transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-45",
                  index === 0
                    ? "border-hg-blue-tint bg-hg-blue-soft text-hg-ink hover:border-hg-blue"
                    : "border-line bg-white text-hg-ink-2 hover:border-hg-blue-tint hover:bg-hg-blue-soft",
                )}
              >
                {reply}
              </motion.button>
            ))}
          </div>
        </div>
      )}
    <form
      className="flex items-center gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        if (!canSend) return;
        session.say(draft);
        setDraft("");
      }}
    >
      <label htmlFor="bank-line" className="sr-only">
        {copy.lineLabel}
      </label>
      <Input
        id="bank-line"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        maxLength={MAX_LINE_CHARS}
        autoComplete="off"
        placeholder={banksTurn ? copy.answer : copy.wait}
        className={cn("rounded-full", panel.field, banksTurn && "border-hg-blue-tint bg-white")}
      />
      <Button type="submit" disabled={!canSend} aria-label={copy.send} className="size-11 shrink-0 px-0">
        <SendHorizontal className="size-4" aria-hidden />
      </Button>
    </form>
    </div>
  );
}
