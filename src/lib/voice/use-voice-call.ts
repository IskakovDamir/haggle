"use client";

// CONTRACT STUB. The voice owner replaces the body but keeps this export and its signature.
// See SPEC.md, "Voice".
import type { NegotiationBrief, Turn } from "@/lib/types";

export type VoiceStatus = "unavailable" | "idle" | "connecting" | "live" | "ended" | "error";

export type VoiceCall = {
  status: VoiceStatus;
  /** A sentence for the user when status is "error" or "unavailable". */
  error: string | null;
  start: () => Promise<void>;
  stop: () => Promise<void>;
};

/**
 * A live voice call in the browser. The agent speaks; whoever is at the microphone plays the bank.
 * Each finished utterance arrives through onTurn (the human is role "bank", the agent is "agent").
 */
export function useVoiceCall(options: {
  brief: NegotiationBrief | null;
  onTurn: (turn: Turn) => void;
  onEnd: (reason: "user" | "agent" | "error") => void;
}): VoiceCall {
  void options;
  return {
    status: "unavailable",
    error: "Voice is not wired up yet.",
    start: async () => undefined,
    stop: async () => undefined,
  };
}
