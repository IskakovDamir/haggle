"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Keyboard, Mic, PencilLine, Phone, Smartphone, Volume2, X } from "lucide-react";
import { EASE } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/primitives";
import type { Copy } from "@/lib/i18n/locale";
import { useLocale } from "@/lib/i18n/use-locale";
import { MAX_REQUEST_CHARS } from "@/lib/negotiator/own-request";
import { toE164 } from "@/lib/voice/phone";
import type { VoiceStatus } from "@/lib/voice/use-voice-call";
import {
  AGENT_VOICES,
  DEFAULT_AGENT_VOICE,
  SPANISH_AGENT_VOICES,
  voicePreviewPathFor,
  type AgentVoice,
} from "@/lib/voice/voices";
import { cn } from "@/lib/utils";
import { Notice } from "./page-states";
import { panel } from "./panel-theme";
import type { CapabilitiesState } from "./use-capabilities";
import type { CallMode } from "./use-call-session";

const MODES: { mode: CallMode; Icon: typeof Mic }[] = [
  { mode: "voice", Icon: Mic },
  { mode: "text", Icon: Keyboard },
  { mode: "phone", Icon: Smartphone },
];

type StartCopy = {
  modes: Record<CallMode, { label: string; hint: string }>;
  willAsk: string;
  ownAsk: string;
  ownLabel: string;
  ownPlaceholder: string;
  ownNote: string;
  useSuggested: string;
  practice: string;
  demo: (bank: string) => string;
  demoPhone: (bank: string) => string;
  stepsTitle: string;
  steps: (bank: string) => string[];
  phoneOpenNote: (prefixes: string) => string;
  notSetUp: string;
  modeGroup: string;
  phoneLabel: string;
  phoneError: string;
  phoneNote: string;
  cardholderLabel: string;
  cardholderOptional: string;
  cardholderNote: string;
  cardholderError: string;
  voicesTitle: string;
  voiceGroup: string;
  /** The voice's kind ("Female"), shown above its name. */
  voiceKind: Record<AgentVoice, string>;
  voiceAria: (kind: string, name: string) => string;
  callPhone: string;
  start: string;
  checking: string;
  noVoiceServer: string;
  noVoiceBrowser: string;
};

const COPY: Copy<StartCopy> = {
  en: {
    modes: {
      voice: { label: "Voice", hint: "You speak as the bank. The agent answers out loud." },
      text: { label: "Typing", hint: "You type the bank's lines. The agent answers in text." },
      phone: { label: "Phone", hint: "The agent rings your phone. Answer it and play the bank. The transcript shows up here." },
    },
    willAsk: "The agent will ask",
    ownAsk: "Ask for something else",
    ownLabel: "What should the agent call about?",
    ownPlaceholder: "Refund the $39 late fee from March and keep it off my credit report",
    ownNote: "In your own words. The agent asks for this, uses only what you write here and on your statement, and never makes anything up.",
    useSuggested: "Use the suggested ask",
    practice: "This is a practice call. You play the bank's representative.",
    demo: (bank) => `Demo with sample data. Press Start, then play ${bank}: tap the suggested replies or type your own. End the call to see the verified result.`,
    demoPhone: (bank) => `Demo with sample data: Maria missed a ${bank} payment. Haggle calls your real phone, and you play the ${bank} rep.`,
    stepsTitle: "What happens",
    steps: (bank) => [
      `Your phone rings from a US number. Answer it: you are the ${bank} rep.`,
      "Haggle says it's an AI assistant, explains the missed payment, and asks for the late fee and the old rate back. A script for you shows on this screen.",
      "Push back, give a little, say no to some of it. Haggle counters, then reads back what you agreed.",
      "Add a second phone below to see the handoff: tell Haggle you need the cardholder, and it rings that phone and connects it.",
      "Hang up when you're done. The result counts only what you, as the bank, actually said.",
    ],
    phoneOpenNote: (prefixes) => `Rings numbers starting with ${prefixes}. Used for this call only and never saved.`,
    notSetUp: "Calls are not set up on this server yet, so the agent cannot start one.",
    modeGroup: "How you will play the bank",
    phoneLabel: "Your phone · you play the bank",
    phoneError: "Type your phone number, like (555) 234-5678.",
    phoneNote: "Only our team's approved phones can be rung, so nobody can use Haggle to call strangers. To try it yourself, pick Voice or Typing.",
    cardholderLabel: "A second phone · the cardholder",
    cardholderOptional: "optional",
    cardholderNote: "A teammate's phone works. If you, as the bank, ask for the cardholder, Haggle rings this phone, connects it to the call and leaves.",
    cardholderError: "Use a phone number like (555) 234-5678, different from the one playing the bank.",
    voicesTitle: "The agent sounds · tap to hear",
    voiceGroup: "The agent voice",
    voiceKind: { female: AGENT_VOICES.female.label, male: AGENT_VOICES.male.label },
    voiceAria: (kind, name) => `${kind} voice, ${name}. Plays a sample.`,
    callPhone: "Call my phone",
    start: "Start the call",
    checking: "Checking what is switched on",
    noVoiceServer: "Voice is not set up on this server.",
    noVoiceBrowser: "Voice is not available in this browser.",
  },
  es: {
    modes: {
      voice: { label: "Voz", hint: "Tú hablas como el banco. El agente responde en voz alta." },
      text: { label: "Texto", hint: "Escribes lo que dice el banco. El agente responde por escrito." },
      phone: { label: "Teléfono", hint: "El agente llama a tu teléfono. Contesta y haz de banco. La transcripción aparece aquí." },
    },
    willAsk: "El agente va a pedir",
    ownAsk: "Pedir otra cosa",
    ownLabel: "¿Para qué debe llamar el agente?",
    ownPlaceholder: "Reembolsar el cargo de $39 de marzo y que no aparezca en mi historial de crédito",
    ownNote: "Con tus palabras. El agente pide esto, usa solo lo que escribes aquí y en tu estado de cuenta, y nunca inventa nada.",
    useSuggested: "Usar lo sugerido",
    practice: "Esta es una llamada de práctica. Tú haces de representante del banco.",
    demo: (bank) => `Demo con datos de ejemplo. Pulsa Empezar y haz de ${bank}: toca las respuestas sugeridas o escribe las tuyas. Termina la llamada para ver el resultado verificado.`,
    demoPhone: (bank) => `Demo con datos de ejemplo: a Maria se le pasó un pago de ${bank}. Haggle llama a tu teléfono real y tú haces de representante de ${bank}.`,
    stepsTitle: "Qué pasa",
    steps: (bank) => [
      `Tu teléfono suena desde un número de EE. UU. Contesta: eres el representante de ${bank}.`,
      "Haggle dice que es un asistente de IA, explica el pago atrasado y pide el cargo y la tasa anterior. Tu guion aparece en esta pantalla.",
      "Resiste, cede un poco, di que no a una parte. Haggle hace una contraoferta y luego repite lo acordado.",
      "Agrega un segundo teléfono abajo para ver el traspaso: dile a Haggle que necesitas al titular y llamará a ese teléfono para conectarlo.",
      "Cuelga cuando termines. El resultado cuenta solo lo que tú, como banco, dijiste de verdad.",
    ],
    phoneOpenNote: (prefixes) => `Llama a números que empiezan con ${prefixes}. Solo se usa para esta llamada y nunca se guarda.`,
    notSetUp: "Las llamadas todavía no están configuradas en este servidor, así que el agente no puede empezar una.",
    modeGroup: "Cómo vas a hacer de banco",
    phoneLabel: "Tu teléfono · haces de banco",
    phoneError: "Escribe tu número de teléfono, como (555) 234-5678.",
    phoneNote: "Solo se puede llamar a los teléfonos aprobados de nuestro equipo, para que nadie use Haggle para llamar a desconocidos. Para probarlo, elige Voz o Texto.",
    cardholderLabel: "Un segundo teléfono · el titular",
    cardholderOptional: "opcional",
    cardholderNote: "Sirve el de un compañero. Si tú, como banco, pides hablar con el titular, Haggle llama a este teléfono, lo une a la llamada y se retira.",
    cardholderError: "Usa un número como (555) 234-5678, distinto del que hace de banco.",
    voicesTitle: "Así suena el agente · toca para escuchar",
    voiceGroup: "La voz del agente",
    voiceKind: { female: "Femenina", male: "Masculina" },
    voiceAria: (kind, name) => `Voz ${kind.toLowerCase()}, ${name}. Reproduce una muestra.`,
    callPhone: "Llamar a mi teléfono",
    start: "Empezar la llamada",
    checking: "Revisando qué está activado",
    noVoiceServer: "La voz no está configurada en este servidor.",
    noVoiceBrowser: "La voz no está disponible en este navegador.",
  },
};

const eyebrow = cn("text-[11px] font-semibold tracking-[0.08em] uppercase", panel.dim);

/** A block of the briefing that rises in a beat after the one above it. */
function Rise({ delay = 0, className, children }: { delay?: number; className?: string; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: EASE, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Three small bars that move while a voice sample plays. */
function Playing() {
  return (
    <span aria-hidden className="flex h-4 items-center gap-[2px]">
      {[0, 0.12, 0.24].map((delay) => (
        <motion.span
          key={delay}
          className="h-4 w-[3px] rounded-[2px] bg-current"
          animate={{ scaleY: [0.35, 1, 0.35] }}
          transition={{ duration: 0.8, ease: "easeInOut", repeat: Infinity, delay }}
        />
      ))}
    </span>
  );
}

/** What the panel shows before the call: the ask, the practice note, and the way to start. */
export function StartControls({
  ask,
  request,
  onRequest,
  demo = false,
  bankName,
  capabilities,
  voice,
  notice,
  onStart,
}: {
  /** What the agent will ask for, as a sentence. */
  ask: string;
  /** The cardholder's own words for the ask, as typed. Empty for the suggested ask. */
  request: string;
  onRequest: (text: string) => void;
  /** Opened from /demo: typing is picked and the steps are spelled out. */
  demo?: boolean;
  bankName: string;
  capabilities: CapabilitiesState;
  voice: { status: VoiceStatus; error: string | null };
  /** A sentence about the previous call, when there is one to tell. */
  notice: string | null;
  /** voiceId is set for a voice call: the agent voice the visitor picked. */
  onStart: (mode: CallMode, voiceId?: string, toNumber?: string, cardholderNumber?: string) => void;
}) {
  const [cardholderNumber, setCardholderNumber] = useState("");
  const [writing, setWriting] = useState(request.trim() !== "");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [triedPhone, setTriedPhone] = useState(false);
  const [picked, setPicked] = useState<CallMode | null>(null);
  const [agentVoice, setAgentVoice] = useState<AgentVoice>(DEFAULT_AGENT_VOICE);
  const [playing, setPlaying] = useState<AgentVoice | null>(null);
  const preview = useRef<HTMLAudioElement | null>(null);
  const locale = useLocale();
  const copy = COPY[locale];
  // A Spanish call speaks with the Spanish voices. The picker still hands AGENT_VOICES ids to onStart:
  // the session swaps in the Spanish voice itself.
  const voiceName = (voice: AgentVoice) => (locale === "es" ? SPANISH_AGENT_VOICES[voice].name : AGENT_VOICES[voice].name);

  /** Pick a voice and play its clip, so the visitor hears it before the call. */
  function chooseVoice(voice: AgentVoice) {
    setAgentVoice(voice);
    preview.current?.pause();
    const audio = new Audio(voicePreviewPathFor(voice, locale));
    preview.current = audio;
    setPlaying(voice);
    audio.onended = () => setPlaying((current) => (current === voice ? null : current));
    audio.play().catch(() => setPlaying(null));
  }

  // Leaving the panel (the call starts, or the page closes) stops the clip.
  useEffect(() => () => preview.current?.pause(), []);

  const switchedOn = capabilities.status === "ready" ? capabilities.capabilities : null;
  const canType = switchedOn?.negotiation ?? false;
  // The voice hook knows more than the server does: it also says no when this browser cannot do voice.
  const canSpeak = (switchedOn?.voice ?? false) && voice.status !== "unavailable";
  const canRing = switchedOn?.phone ?? false;
  const available: Record<CallMode, boolean> = { voice: canSpeak, text: canType, phone: canRing };
  // The demo starts on a real phone call when the server can place one, else on typing.
  const fallback: CallMode = demo ? (canRing ? "phone" : canType ? "text" : "voice") : canSpeak ? "voice" : canType ? "text" : "phone";
  const mode: CallMode = picked && available[picked] ? picked : available[fallback] ? fallback : canSpeak ? "voice" : canType ? "text" : "phone";
  const openPrefixes = switchedOn?.phoneOpen ?? [];
  const phoneNote = openPrefixes.length > 0 ? copy.phoneOpenNote(openPrefixes.join(locale === "es" ? " o " : " or ")) : copy.phoneNote;
  const modes = MODES.filter((option) => available[option.mode]);
  const phoneE164 = toE164(phoneNumber);
  const phoneError = triedPhone && !phoneE164 ? copy.phoneError : null;
  const cardholderE164 = cardholderNumber.trim() === "" ? undefined : toE164(cardholderNumber);
  const cardholderError =
    triedPhone && (cardholderE164 === null || (cardholderE164 && cardholderE164 === phoneE164)) ? copy.cardholderError : null;

  function startCall() {
    if (mode === "phone") {
      if (!phoneE164) {
        setTriedPhone(true);
        document.getElementById("call-phone-number")?.focus();
        return;
      }
      if (cardholderE164 === null || (cardholderE164 && cardholderE164 === phoneE164)) {
        setTriedPhone(true);
        document.getElementById("call-cardholder-number")?.focus();
        return;
      }
      onStart("phone", AGENT_VOICES[agentVoice].id, phoneE164, cardholderE164);
      return;
    }
    onStart(mode, mode === "voice" ? AGENT_VOICES[agentVoice].id : undefined);
  }

  return (
    <div className="flex flex-col gap-4" data-tour="call-start">
      <Rise>
        <p className={eyebrow}>{copy.willAsk}</p>
        {writing ? (
          <div className="mt-2 flex flex-col gap-2">
            <label htmlFor="call-own-request" className="text-sm font-semibold text-hg-ink-2">
              {copy.ownLabel}
            </label>
            <textarea
              id="call-own-request"
              autoFocus
              rows={3}
              value={request}
              maxLength={MAX_REQUEST_CHARS}
              onChange={(event) => onRequest(event.target.value.replace(/[\r\n]+/g, " "))}
              placeholder={copy.ownPlaceholder}
              className={cn(
                "w-full resize-none rounded-2xl border px-4 py-3 text-[17px] leading-snug font-medium outline-none focus-visible:border-hg-blue focus-visible:ring-3 focus-visible:ring-hg-blue/15",
                panel.field,
              )}
            />
            <div className="flex items-start justify-between gap-3">
              <p className={cn("text-[13px] leading-5", panel.dim)}>{copy.ownNote}</p>
              <button
                type="button"
                onClick={() => {
                  onRequest("");
                  setWriting(false);
                }}
                className="flex shrink-0 items-center gap-1 text-[13px] font-semibold text-hg-blue hover:underline"
              >
                <X className="size-3.5" aria-hidden />
                {copy.useSuggested}
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="mt-1.5 text-[22px] leading-[1.25] font-semibold tracking-[-0.02em] text-hg-ink sm:text-[26px]">{ask}</p>
            <button
              type="button"
              onClick={() => setWriting(true)}
              className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-hg-blue underline-offset-4 hover:underline"
            >
              <PencilLine className="size-4" aria-hidden />
              {copy.ownAsk}
            </button>
          </>
        )}
      </Rise>

      <Rise delay={0.08}>
        <p className="flex items-start gap-2.5 rounded-2xl bg-hg-blue-soft px-3.5 py-3 text-[15px] leading-snug font-medium text-hg-ink-2">
          <span aria-hidden className="mt-[7px] size-1.5 shrink-0 rounded-full bg-hg-blue" />
          {demo ? (mode === "phone" ? copy.demoPhone(bankName) : copy.demo(bankName)) : copy.practice}
        </p>
      </Rise>

      {notice && <Notice tone="dark">{notice}</Notice>}
      {capabilities.status === "error" && <Notice tone="dark">{capabilities.message}</Notice>}
      {switchedOn && !canType && !canSpeak && !canRing && (
        <Notice tone="dark">{copy.notSetUp}</Notice>
      )}

      {modes.length > 1 && (
        <Rise delay={0.16}>
          <div
            role="radiogroup"
            aria-label={copy.modeGroup}
            className={cn("grid gap-1 rounded-full bg-hg-surface p-1", modes.length === 3 ? "grid-cols-3" : "grid-cols-2")}
          >
            {modes.map(({ mode: option, Icon }) => {
              const selected = mode === option;
              return (
                <button
                  key={option}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setPicked(option)}
                  className={cn(
                    "relative flex h-10 cursor-pointer items-center justify-center gap-2 rounded-full text-sm font-semibold transition-colors duration-200",
                    selected ? "text-hg-ink" : "text-hg-muted hover:text-hg-ink-2",
                  )}
                >
                  {selected && (
                    <motion.span
                      layoutId="call-mode-pill"
                      aria-hidden
                      className="absolute inset-0 rounded-full bg-white shadow-[0_1px_2px_rgb(11_18_32/0.06),0_6px_16px_-8px_rgb(11_18_32/0.2)]"
                      transition={{ duration: 0.4, ease: EASE }}
                    />
                  )}
                  <Icon className={cn("relative size-4", selected && "text-hg-blue")} aria-hidden />
                  <span className="relative">{copy.modes[option].label}</span>
                </button>
              );
            })}
          </div>
        </Rise>
      )}

      <AnimatePresence initial={false}>
        {mode === "phone" && canRing && (
          <motion.div
            key="phone"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
            className="overflow-hidden"
          >
            <div className="mb-4 rounded-2xl border border-line bg-white p-4">
              <p className={cn(eyebrow, "mb-2.5")}>{copy.stepsTitle}</p>
              <ol className="flex flex-col gap-2">
                {copy.steps(bankName).map((step, index) => (
                  <li key={step} className="flex items-start gap-2.5 text-[14px] leading-snug text-hg-ink-2">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-hg-blue-soft text-[11px] font-bold text-hg-blue">
                      {index + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
            <label htmlFor="call-phone-number" className={cn(eyebrow, "mb-2 block")}>
              {copy.phoneLabel}
            </label>
            <Input
              id="call-phone-number"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="(555) 234-5678"
              value={phoneNumber}
              onChange={(event) => setPhoneNumber(event.target.value)}
              aria-invalid={phoneError ? true : undefined}
              aria-describedby="call-phone-note"
              className={cn(phoneError && "border-alarm")}
            />
            <p id="call-phone-note" className={cn("mt-1.5 text-xs", phoneError ? "text-alarm" : panel.dim)}>
              {phoneError ?? phoneNote}
            </p>
            <label htmlFor="call-cardholder-number" className={cn(eyebrow, "mt-4 mb-2 block")}>
              {copy.cardholderLabel} <span className="normal-case tracking-normal">· {copy.cardholderOptional}</span>
            </label>
            <Input
              id="call-cardholder-number"
              type="tel"
              inputMode="tel"
              placeholder="(555) 987-6543"
              value={cardholderNumber}
              onChange={(event) => setCardholderNumber(event.target.value)}
              aria-invalid={cardholderError ? true : undefined}
              aria-describedby="call-cardholder-note"
              className={cn(cardholderError && "border-alarm")}
            />
            <p id="call-cardholder-note" className={cn("mt-1.5 text-xs", cardholderError ? "text-alarm" : panel.dim)}>
              {cardholderError ?? copy.cardholderNote}
            </p>
          </motion.div>
        )}
        {(mode === "voice" || mode === "phone") && (canSpeak || canRing) && (
          <motion.div
            key="voices"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
            className="overflow-hidden"
          >
            <p className={cn(eyebrow, "mb-2")}>{copy.voicesTitle}</p>
            <div role="radiogroup" aria-label={copy.voiceGroup} className="grid grid-cols-2 gap-2">
              {(Object.keys(AGENT_VOICES) as AgentVoice[]).map((option) => {
                const selected = agentVoice === option;
                return (
                  <button
                    key={option}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => chooseVoice(option)}
                    aria-label={copy.voiceAria(copy.voiceKind[option], voiceName(option))}
                    className={cn(
                      "group relative flex cursor-pointer items-center gap-3 rounded-[18px] border p-3 text-left transition-[border-color,transform] duration-200 active:scale-[0.98]",
                      selected ? "border-transparent" : "border-line hover:border-hg-blue-tint",
                    )}
                  >
                    {selected && (
                      <motion.span
                        layoutId="agent-voice-pick"
                        aria-hidden
                        className="absolute inset-0 rounded-[18px] border-2 border-hg-blue bg-hg-blue-soft"
                        transition={{ duration: 0.4, ease: EASE }}
                      />
                    )}
                    <span
                      aria-hidden
                      className={cn(
                        "relative flex size-9 shrink-0 items-center justify-center rounded-full transition-colors duration-300",
                        selected ? "bg-hg-blue text-white" : "bg-hg-surface text-hg-ink-2",
                      )}
                    >
                      {playing === option ? <Playing /> : <Volume2 className="size-4" />}
                    </span>
                    <span className="relative flex min-w-0 flex-col text-sm leading-tight">
                      <span className="font-semibold text-hg-ink">{copy.voiceKind[option]}</span>
                      <span className="truncate text-hg-muted">{voiceName(option)}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {(canType || canSpeak || canRing) && (
        <Rise delay={0.24} className="flex flex-col gap-3">
          <Button
            size="lg"
            className="group w-full"
            onClick={startCall}
          >
            <Phone className="size-4 transition-transform duration-300 group-hover:-rotate-12" aria-hidden />
            {mode === "phone" ? copy.callPhone : copy.start}
          </Button>
          <p className={cn("text-sm", panel.dim)}>
            {copy.modes[mode].hint}
            {!canSpeak && mode !== "phone" && ` ${whyNoVoice(switchedOn?.voice ?? false, voice.error, copy)}`}
          </p>
        </Rise>
      )}

      {capabilities.status === "loading" && (
        <Button size="lg" className="hg-shimmer w-full text-hg-ink-2 shadow-none" disabled>
          {copy.checking}
        </Button>
      )}
    </div>
  );
}

/** One sentence on why this call is typed, not spoken. */
function whyNoVoice(voiceIsConfigured: boolean, voiceError: string | null, copy: StartCopy): string {
  if (!voiceIsConfigured) return copy.noVoiceServer;
  return voiceError ?? copy.noVoiceBrowser;
}
