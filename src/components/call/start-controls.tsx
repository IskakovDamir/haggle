"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Keyboard, Mic, Phone, Smartphone, Volume2 } from "lucide-react";
import { EASE } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/primitives";
import type { Copy } from "@/lib/i18n/locale";
import { useLocale } from "@/lib/i18n/use-locale";
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
  practice: string;
  notSetUp: string;
  modeGroup: string;
  phoneLabel: string;
  phoneError: string;
  phoneNote: string;
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
    practice: "This is a practice call. You play the bank's representative.",
    notSetUp: "Calls are not set up on this server yet, so the agent cannot start one.",
    modeGroup: "How you will play the bank",
    phoneLabel: "Your phone number",
    phoneError: "Type your phone number, like (555) 234-5678.",
    phoneNote: "Used for this one call and not saved. Only numbers the owner of this server approved can be rung.",
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
    practice: "Esta es una llamada de práctica. Tú haces de representante del banco.",
    notSetUp: "Las llamadas todavía no están configuradas en este servidor, así que el agente no puede empezar una.",
    modeGroup: "Cómo vas a hacer de banco",
    phoneLabel: "Tu número de teléfono",
    phoneError: "Escribe tu número de teléfono, como (555) 234-5678.",
    phoneNote: "Solo se usa para esta llamada y no se guarda. Solo se puede llamar a números que aprobó quien administra este servidor.",
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
  capabilities,
  voice,
  notice,
  onStart,
}: {
  /** What the agent will ask for, as a sentence. */
  ask: string;
  capabilities: CapabilitiesState;
  voice: { status: VoiceStatus; error: string | null };
  /** A sentence about the previous call, when there is one to tell. */
  notice: string | null;
  /** voiceId is set for a voice call: the agent voice the visitor picked. */
  onStart: (mode: CallMode, voiceId?: string, toNumber?: string) => void;
}) {
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
  const mode: CallMode = picked && available[picked] ? picked : canSpeak ? "voice" : canType ? "text" : "phone";
  const modes = MODES.filter((option) => available[option.mode]);
  const phoneE164 = toE164(phoneNumber);
  const phoneError = triedPhone && !phoneE164 ? copy.phoneError : null;

  function startCall() {
    if (mode === "phone") {
      if (!phoneE164) {
        setTriedPhone(true);
        document.getElementById("call-phone-number")?.focus();
        return;
      }
      onStart("phone", AGENT_VOICES[agentVoice].id, phoneE164);
      return;
    }
    onStart(mode, mode === "voice" ? AGENT_VOICES[agentVoice].id : undefined);
  }

  return (
    <div className="flex flex-col gap-4">
      <Rise>
        <p className={eyebrow}>{copy.willAsk}</p>
        <p className="mt-1.5 text-[22px] leading-[1.25] font-semibold tracking-[-0.02em] text-hg-ink sm:text-[26px]">{ask}</p>
      </Rise>

      <Rise delay={0.08}>
        <p className="flex items-start gap-2.5 rounded-2xl bg-hg-blue-soft px-3.5 py-3 text-[15px] leading-snug font-medium text-hg-ink-2">
          <span aria-hidden className="mt-[7px] size-1.5 shrink-0 rounded-full bg-hg-blue" />
          {copy.practice}
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
              {phoneError ?? copy.phoneNote}
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
