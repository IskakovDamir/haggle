"use client";

import { useEffect, useRef, useState } from "react";
import { Keyboard, Mic, Phone, Volume2 } from "lucide-react";
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
      <div>
        <p className={cn("text-[11px] font-semibold tracking-[0.08em] uppercase", panel.dim)}>The agent will ask</p>
        <p className="mt-1.5 text-xl leading-snug font-bold tracking-tight sm:text-2xl">{ask}</p>
      </div>

      <p className={cn("rounded-2xl border px-3.5 py-3 text-[15px] leading-snug", panel.agentBubble)}>
        This is a practice call. You play the bank&apos;s representative.
      </p>

      {notice && <Notice tone="dark">{notice}</Notice>}
      {capabilities.status === "error" && <Notice tone="dark">{capabilities.message}</Notice>}
      {switchedOn && !canType && !canSpeak && (
        <Notice tone="dark">Calls are not set up on this server yet, so the agent cannot start one.</Notice>
      )}

      {canType && canSpeak && (
        <div role="radiogroup" aria-label="How you will play the bank" className="grid grid-cols-2 gap-2">
          {MODES.map(({ mode: option, label, Icon }) => (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={mode === option}
              onClick={() => setPicked(option)}
              className={cn(
                "flex h-11 cursor-pointer items-center justify-center gap-2 rounded-full border text-sm font-medium transition-colors",
                mode === option ? "border-lime bg-lime/10 text-lime" : cn(panel.rule, panel.dim, "hover:text-[#e9e8e3]"),
              )}
            >
              <Icon className="size-4" aria-hidden />
              {label}
            </button>
          ))}
        </div>
      )}

      {mode === "voice" && canSpeak && (
        <div>
          <p className={cn("mb-2 text-[11px] font-semibold tracking-[0.08em] uppercase", panel.dim)}>The agent sounds · tap to hear</p>
          <div role="radiogroup" aria-label="The agent voice" className="grid grid-cols-2 gap-2">
            {(Object.keys(AGENT_VOICES) as AgentVoice[]).map((option) => (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={agentVoice === option}
                onClick={() => chooseVoice(option)}
                aria-label={`${AGENT_VOICES[option].label} voice, ${AGENT_VOICES[option].name}. Plays a sample.`}
                className={cn(
                  "flex h-11 cursor-pointer items-center justify-center gap-1.5 rounded-full border text-sm font-medium transition-colors",
                  agentVoice === option ? "border-lime bg-lime/10 text-lime" : cn(panel.rule, panel.dim, "hover:text-[#e9e8e3]"),
                )}
              >
                <Volume2 className={cn("size-4", playing === option ? "animate-pulse" : "opacity-60")} aria-hidden />
                {AGENT_VOICES[option].label}
                <span className="opacity-70">· {AGENT_VOICES[option].name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {(canType || canSpeak) && (
        <>
          <Button
            size="lg"
            className="w-full bg-lime text-ink hover:bg-lime/90"
            onClick={() => onStart(mode, mode === "voice" ? AGENT_VOICES[agentVoice].id : undefined)}
          >
            <Phone className="size-4" aria-hidden />
            Start the call
          </Button>
          <p className={cn("text-sm", panel.dim)}>
            {MODES.find((option) => option.mode === mode)?.hint}
            {!canSpeak && ` ${whyNoVoice(switchedOn?.voice ?? false, voice.error)}`}
          </p>
        </>
      )}

      {capabilities.status === "loading" && (
        <Button size="lg" className="w-full bg-lime text-ink" disabled>
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
