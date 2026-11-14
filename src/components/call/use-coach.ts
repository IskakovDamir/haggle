"use client";

// The live coach: the browser's microphone hears the cardholder's own call with the bank (phone on
// speaker), realtime speech to text writes it down, and after each finished line /api/coach suggests
// what to say next. One tip request at a time: lines heard meanwhile go into the next one.
import { useCallback, useEffect, useRef, useState } from "react";
import { CommitStrategy, useScribe } from "@elevenlabs/react";
import type { CoachTip, NegotiationBrief, Turn } from "@/lib/types";
import { fetchCoachTip, fetchScribeToken } from "./api";

/** The newest lines sent with each tip request. The route accepts up to 40. */
const LINES_SENT = 40;

export type CoachStatus = "off" | "starting" | "listening" | "unavailable" | "error";

export type Coach = {
  status: CoachStatus;
  /** Lines the microphone heard, oldest first, and the one still being said. */
  lines: string[];
  partial: string;
  tip: CoachTip | null;
  thinking: boolean;
  error: string | null;
  start: () => void;
  stop: () => void;
};

const COPY = {
  en: {
    off: "The live coach is switched off on this server.",
    mic: "The microphone is blocked. Allow it in your browser and try again.",
    lost: "The coach lost the microphone connection. Start it again.",
  },
  es: {
    off: "El coach en vivo está desactivado en este servidor.",
    mic: "El micrófono está bloqueado. Permítelo en tu navegador e inténtalo de nuevo.",
    lost: "El coach perdió la conexión del micrófono. Vuelve a iniciarlo.",
  },
};

export function useCoach(input: { brief: NegotiationBrief; earlier: Turn[] }): Coach {
  const { brief, earlier } = input;
  const copy = COPY[brief.language ?? "en"];
  const [status, setStatus] = useState<CoachStatus>("off");
  const [lines, setLines] = useState<string[]>([]);
  const [tip, setTip] = useState<CoachTip | null>(null);
  const [thinking, setThinking] = useState(false);
  /** The microphone or the speech service failed. */
  const [error, setError] = useState<string | null>(null);
  /** The last tip request failed. Cleared by the next one that works. */
  const [tipError, setTipError] = useState<string | null>(null);

  const heard = useRef<string[]>([]);
  const inFlight = useRef(false);
  const again = useRef(false);
  const live = useRef(true);
  useEffect(() => {
    live.current = true;
    return () => {
      live.current = false;
    };
  }, []);

  /** Ask for a tip on everything heard so far. A request already out means one more after it. */
  const askForTip = useCallback(async () => {
    if (inFlight.current) {
      again.current = true;
      return;
    }
    inFlight.current = true;
    setThinking(true);
    do {
      again.current = false;
      const result = await fetchCoachTip(brief, earlier, heard.current.slice(-LINES_SENT));
      if (!live.current) return;
      if (result.ok) {
        setTip(result.data.tip);
        setTipError(null);
      } else {
        setTipError(result.error);
      }
    } while (again.current);
    inFlight.current = false;
    setThinking(false);
  }, [brief, earlier]);

  // The scribe hook keeps the callbacks it had when it connected, so they go through a ref.
  const onLine = useRef<(text: string) => void>(() => {});
  const onLost = useRef<() => void>(() => {});
  useEffect(() => {
    onLine.current = (text: string) => {
      const line = text.trim();
      if (line === "") return;
      heard.current = [...heard.current, line];
      setLines(heard.current);
      void askForTip();
    };
    onLost.current = () => {
      setStatus((current) => (current === "listening" || current === "starting" ? "error" : current));
      setError((current) => current ?? copy.lost);
    };
  }, [askForTip, copy.lost]);

  const scribe = useScribe({
    modelId: "scribe_v2_realtime",
    commitStrategy: CommitStrategy.VAD,
    languageCode: brief.language ?? "en",
    // A phone on speaker is quiet speech in a room: keep the voice, drop the hum.
    microphone: { echoCancellation: false, noiseSuppression: true, autoGainControl: true },
    onCommittedTranscript: ({ text }) => onLine.current(text),
    onError: () => onLost.current(),
    onDisconnect: () => onLost.current(),
  });

  const start = useCallback(async () => {
    setError(null);
    setStatus("starting");
    // The first tip (how to open, or what to say right after the handoff) comes before anyone speaks.
    if (heard.current.length === 0 && tip === null) void askForTip();

    const token = await fetchScribeToken();
    if (!live.current) return;
    if (!token.ok) {
      setStatus("error");
      setError(token.error);
      return;
    }
    if (!token.data.configured) {
      setStatus("unavailable");
      setError(copy.off);
      return;
    }
    // Ask for the microphone first: the speech SDK reports a refusal only as a closed connection.
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
    } catch {
      if (!live.current) return;
      setStatus("error");
      setError(copy.mic);
      return;
    }
    if (!live.current) return;
    setStatus("listening");
    try {
      await scribe.connect({ token: token.data.token });
    } catch {
      if (!live.current) return;
      setStatus("error");
      setError(copy.lost);
    }
  }, [askForTip, copy.lost, copy.mic, copy.off, scribe, tip]);

  const stop = useCallback(() => {
    scribe.disconnect();
    setStatus("off");
  }, [scribe]);

  return {
    status,
    lines,
    partial: status === "listening" ? scribe.partialTranscript : "",
    tip,
    thinking,
    error: error ?? tipError,
    start: () => void start(),
    stop,
  };
}
