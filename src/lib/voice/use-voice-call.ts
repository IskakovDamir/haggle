"use client";

// A voice call with the ElevenLabs agent, in the browser. See SPEC.md, "Voice".
//
//   start() -> POST /api/voice/session -> microphone -> SDK connects over WebRTC -> live
//
// The server mints a token for one call; the ElevenLabs key never reaches this file.
import { useCallback, useEffect, useRef, useState } from "react";
import type { NegotiationBrief, Turn } from "@/lib/types";
import { VOICE_PROBLEM, microphoneProblem } from "./problems";
import { MAX_CALL_MS, requestVoiceSession } from "./session";
import { endReasonFrom, turnFromMessage, type EndReason } from "./transcript";

export type VoiceStatus = "unavailable" | "idle" | "connecting" | "live" | "ended" | "error";

export type VoiceCall = {
  status: VoiceStatus;
  /** A sentence for the user when status is "error" or "unavailable". */
  error: string | null;
  /** Starts the call. voiceId picks the agent voice (see voices.ts); without it the agent keeps its default. */
  start: (voiceId?: string) => Promise<void>;
  stop: () => Promise<void>;
};

type Options = {
  brief: NegotiationBrief | null;
  onTurn: (turn: Turn) => void;
  onEnd: (reason: EndReason) => void;
};

/**
 * One try at a call, from start() until it is over. Every callback belongs to its own attempt and
 * checks `over` first, so a call that was stopped or replaced can never touch the page again.
 */
type Attempt = {
  /** performance.now() when start() was called: the zero point of every turn's `at`. */
  startedAt: number;
  conversation: { endSession: () => Promise<void> } | null;
  /** Our own microphone stream. It only exists to ask for permission before the SDK connects. */
  microphone: MediaStream | null;
  timer: ReturnType<typeof setTimeout> | null;
  hitTimeLimit: boolean;
  /** How many turns reached the page. A call that ends with none never really started. */
  turnsHeard: number;
  over: boolean;
};

function release(attempt: Attempt) {
  attempt.over = true;
  if (attempt.timer) clearTimeout(attempt.timer);
  attempt.timer = null;
  closeMicrophone(attempt);
}

function closeMicrophone(attempt: Attempt) {
  attempt.microphone?.getTracks().forEach((track) => track.stop());
  attempt.microphone = null;
}

/** Ask for the microphone. A page that is not served over HTTPS has no mediaDevices at all. */
function openMicrophone(): Promise<MediaStream> {
  if (!navigator.mediaDevices?.getUserMedia) {
    return Promise.reject(new DOMException("No microphone access on this page.", "NotSupportedError"));
  }
  return navigator.mediaDevices.getUserMedia({ audio: true });
}

/**
 * A live voice call in the browser. The agent speaks; whoever is at the microphone plays the bank.
 * Each finished utterance arrives through onTurn (the human is role "bank", the agent is "agent"),
 * with `at` counted from the moment start() was called.
 *
 * onEnd fires once for a call that connected: "user" after stop(), "agent" when the agent hung up
 * or the five-minute limit was reached, "error" when the connection dropped or closed before a word
 * was said. A call that never connects (no key, no microphone) does not fire onEnd: it sets `status`
 * and `error` instead.
 * The microphone is asked for inside start() and nowhere else.
 */
export function useVoiceCall(options: Options): VoiceCall {
  const [state, setState] = useState<{ status: VoiceStatus; error: string | null }>({ status: "idle", error: null });
  const current = useRef<Attempt | null>(null);

  // The call outlives the render that started it, so its callbacks read the latest options from a ref.
  const latest = useRef(options);
  useEffect(() => {
    latest.current = options;
  });

  const start = useCallback(async (voiceId?: string) => {
    if (current.current && !current.current.over) return;
    const brief = latest.current.brief;
    if (!brief) {
      setState({ status: "error", error: VOICE_PROBLEM.noBrief });
      return;
    }

    const attempt: Attempt = {
      startedAt: performance.now(),
      conversation: null,
      microphone: null,
      timer: null,
      hitTimeLimit: false,
      turnsHeard: 0,
      over: false,
    };
    current.current = attempt;
    setState({ status: "connecting", error: null });

    /** The call could not start. Nothing was said, so onEnd is not called. */
    const giveUp = (status: "error" | "unavailable", error: string) => {
      if (attempt.over) return;
      release(attempt);
      setState({ status, error });
    };

    /** A call that connected is over. */
    const finish = (reason: EndReason) => {
      if (attempt.over) return;
      release(attempt);
      const problem = attempt.turnsHeard === 0 ? VOICE_PROBLEM.couldNotConnect : VOICE_PROBLEM.dropped;
      setState(reason === "error" ? { status: "error", error: problem } : { status: "ended", error: null });
      latest.current.onEnd(reason);
    };

    // 1. The server says whether voice is set up, before the browser asks for anything.
    const answer = await requestVoiceSession(brief);
    if (attempt.over) return;
    if (!answer.ok) return giveUp("error", answer.error);
    if (!answer.session.configured) return giveUp("unavailable", VOICE_PROBLEM.notConfigured);
    const { conversationToken, dynamicVariables } = answer.session;

    // 2. The microphone. Asking here, not inside the SDK, lets us say exactly what went wrong.
    try {
      attempt.microphone = await openMicrophone();
    } catch (error) {
      return giveUp("error", microphoneProblem(error));
    }
    if (attempt.over) return closeMicrophone(attempt);

    // 3. Connect. The SDK is loaded here so pages that never start a voice call do not download it.
    try {
      const { Conversation } = await import("@elevenlabs/react");
      const conversation = await Conversation.startSession({
        conversationToken,
        connectionType: "webrtc",
        dynamicVariables,
        ...(voiceId ? { overrides: { tts: { voiceId } } } : {}),
        // Voice models may write tags such as [laughs] into the text. The transcript is for reading.
        stripAudioTags: true,
        onMessage: (message) => {
          if (attempt.over) return;
          // An agent line arrives when it starts being spoken. If the bank cuts it short, the line
          // still stands in full: turns are append-only and the bank's own words are what is checked.
          const turn = turnFromMessage(message, performance.now() - attempt.startedAt);
          if (!turn) return;
          attempt.turnsHeard += 1;
          latest.current.onTurn(turn);
        },
        onDisconnect: (details) => finish(attempt.hitTimeLimit ? "agent" : endReasonFrom(details, attempt.turnsHeard)),
        onError: (message) => console.warn("[voice]", message),
      });

      // stop() or an unmount while connecting: hang up without a word.
      if (attempt.over) {
        await conversation.endSession().catch(() => undefined);
        return;
      }
      attempt.conversation = conversation;
      attempt.timer = setTimeout(() => {
        attempt.hitTimeLimit = true;
        void conversation.endSession().catch(() => undefined);
      }, MAX_CALL_MS);
      setState({ status: "live", error: null });
    } catch (error) {
      console.warn("[voice] could not connect:", error instanceof Error ? error.message : error);
      giveUp("error", VOICE_PROBLEM.couldNotConnect);
    } finally {
      // The SDK holds its own stream by now.
      closeMicrophone(attempt);
    }
  }, []);

  const stop = useCallback(async () => {
    const attempt = current.current;
    if (!attempt || attempt.over) return;
    if (attempt.conversation) {
      // The SDK answers with onDisconnect, which reports the end as "user".
      await attempt.conversation.endSession().catch(() => undefined);
      return;
    }
    // Still connecting: call it off quietly.
    release(attempt);
    setState({ status: "idle", error: null });
  }, []);

  // Leaving the page hangs up and frees the microphone. Nothing is reported to a page that is gone.
  useEffect(
    () => () => {
      const attempt = current.current;
      if (!attempt || attempt.over) return;
      release(attempt);
      void attempt.conversation?.endSession().catch(() => undefined);
    },
    [],
  );

  return { status: state.status, error: state.error, start, stop };
}
