"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Keyboard, Mic, Phone, Volume2 } from "lucide-react";
import { EASE } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import type { VoiceStatus } from "@/lib/voice/use-voice-call";
import { AGENT_VOICES, DEFAULT_AGENT_VOICE, voicePreviewPath, type AgentVoice } from "@/lib/voice/voices";
import { cn } from "@/lib/utils";
import { Notice } from "./page-states";
import { panel } from "./panel-theme";
import type { CapabilitiesState } from "./use-capabilities";
import type { CallMode } from "./use-call-session";

const MODES: { mode: CallMode; label: string; hint: string; Icon: typeof Mic }[] = [
  { mode: "voice", label: "Voice", hint: "You speak as the bank. The agent answers out loud.", Icon: Mic },
  { mode: "text", label: "Typing", hint: "You type the bank's lines. The agent answers in text.", Icon: Keyboard },
];

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
  onStart: (mode: CallMode, voiceId?: string) => void;
}) {
  const [picked, setPicked] = useState<CallMode | null>(null);
  const [agentVoice, setAgentVoice] = useState<AgentVoice>(DEFAULT_AGENT_VOICE);
  const [playing, setPlaying] = useState<AgentVoice | null>(null);
  const preview = useRef<HTMLAudioElement | null>(null);

  /** Pick a voice and play its clip, so the visitor hears it before the call. */
  function chooseVoice(voice: AgentVoice) {
    setAgentVoice(voice);
    preview.current?.pause();
    const audio = new Audio(voicePreviewPath(voice));
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
  const available = { voice: canSpeak, text: canType };
  const mode: CallMode = picked && available[picked] ? picked : canSpeak ? "voice" : "text";

  return (
    <div className="flex flex-col gap-4">
      <Rise>
        <p className={eyebrow}>The agent will ask</p>
        <p className="mt-1.5 text-[22px] leading-[1.25] font-semibold tracking-[-0.02em] text-hg-ink sm:text-[26px]">{ask}</p>
      </Rise>

      <Rise delay={0.08}>
        <p className="flex items-start gap-2.5 rounded-2xl bg-hg-blue-soft px-3.5 py-3 text-[15px] leading-snug font-medium text-hg-ink-2">
          <span aria-hidden className="mt-[7px] size-1.5 shrink-0 rounded-full bg-hg-blue" />
          This is a practice call. You play the bank&apos;s representative.
        </p>
      </Rise>

      {notice && <Notice tone="dark">{notice}</Notice>}
      {capabilities.status === "error" && <Notice tone="dark">{capabilities.message}</Notice>}
      {switchedOn && !canType && !canSpeak && (
        <Notice tone="dark">Calls are not set up on this server yet, so the agent cannot start one.</Notice>
      )}

      {canType && canSpeak && (
        <Rise delay={0.16}>
          <div
            role="radiogroup"
            aria-label="How you will play the bank"
            className="grid grid-cols-2 gap-1 rounded-full bg-hg-surface p-1"
          >
            {MODES.map(({ mode: option, label, Icon }) => {
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
                  <span className="relative">{label}</span>
                </button>
              );
            })}
          </div>
        </Rise>
      )}

      <AnimatePresence initial={false}>
        {mode === "voice" && canSpeak && (
          <motion.div
            key="voices"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
            className="overflow-hidden"
          >
            <p className={cn(eyebrow, "mb-2")}>The agent sounds · tap to hear</p>
            <div role="radiogroup" aria-label="The agent voice" className="grid grid-cols-2 gap-2">
              {(Object.keys(AGENT_VOICES) as AgentVoice[]).map((option) => {
                const selected = agentVoice === option;
                return (
                  <button
                    key={option}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => chooseVoice(option)}
                    aria-label={`${AGENT_VOICES[option].label} voice, ${AGENT_VOICES[option].name}. Plays a sample.`}
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
                      <span className="font-semibold text-hg-ink">{AGENT_VOICES[option].label}</span>
                      <span className="truncate text-hg-muted">{AGENT_VOICES[option].name}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {(canType || canSpeak) && (
        <Rise delay={0.24} className="flex flex-col gap-3">
          <Button
            size="lg"
            className="group w-full"
            onClick={() => onStart(mode, mode === "voice" ? AGENT_VOICES[agentVoice].id : undefined)}
          >
            <Phone className="size-4 transition-transform duration-300 group-hover:-rotate-12" aria-hidden />
            Start the call
          </Button>
          <p className={cn("text-sm", panel.dim)}>
            {MODES.find((option) => option.mode === mode)?.hint}
            {!canSpeak && ` ${whyNoVoice(switchedOn?.voice ?? false, voice.error)}`}
          </p>
        </Rise>
      )}

      {capabilities.status === "loading" && (
        <Button size="lg" className="hg-shimmer w-full text-hg-ink-2 shadow-none" disabled>
          Checking what is switched on
        </Button>
      )}
    </div>
  );
}

/** One sentence on why this call is typed, not spoken. */
function whyNoVoice(voiceIsConfigured: boolean, voiceError: string | null): string {
  if (!voiceIsConfigured) return "Voice is not set up on this server.";
  return voiceError ?? "Voice is not available in this browser.";
}
