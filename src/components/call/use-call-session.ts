"use client";

// One practice call from "Start" to a stored result.
//
//   briefing -> live -> reading -> done
//
// The agent's lines come from /api/negotiate (typed call), from the voice hook (spoken call in the
// browser) or from the phone call's transcript, which this hook polls (/api/voice/phone/{id}).
// When the call ends, /api/outcome reads the transcript and the engine turns the outcome into savings.
import { useCallback, useEffect, useRef, useState } from "react";
import { savingsFromOutcome } from "@/lib/engine";
import { newCall, useCaseFile, withCall } from "@/lib/store";
import type { CallRecord, CardAccount, NegotiationBrief, Savings, Turn } from "@/lib/types";
import { useVoiceCall, type VoiceStatus } from "@/lib/voice/use-voice-call";
import type { PhoneCallStatus } from "@/lib/voice/phone";
import { spokenVoiceId } from "@/lib/voice/voices";
import { fetchAgentReply, fetchOutcome, fetchPhoneStatus, startPhoneCall } from "./api";

export type CallMode = CallRecord["mode"];
export type CallPhase = "briefing" | "live" | "reading" | "done";

/** Something failed. `retry` says which request to send again. */
export type CallProblem = { message: string; retry: "reply" | "outcome" };

export type CallSession = {
  phase: CallPhase;
  mode: CallMode | null;
  turns: Turn[];
  callId: string | null;
  startedAtMs: number | null;
  /** True while a typed call waits for the agent's next line. */
  agentIsReplying: boolean;
  problem: CallProblem | null;
  /** A sentence about the previous call, shown before the next one starts. */
  notice: string | null;
  voice: { status: VoiceStatus; error: string | null };
  /** A phone call: "placing" until the server answers, then the line's own status. */
  phone: { status: "idle" | "placing" | PhoneCallStatus; transferred: boolean; withCardholder: boolean };
  start: (mode: CallMode, voiceId?: string, toNumber?: string, cardholderNumber?: string) => void;
  /** The visitor's line as the bank, in a typed call. */
  say: (text: string) => void;
  retry: () => void;
  end: () => void;
  /** Carry on by typing after voice failed. */
  typeInstead: () => void;
  /** Back to the briefing for another call. */
  reset: () => void;
};

const msSinceStart = (call: CallRecord) => Math.max(0, Date.now() - Date.parse(call.startedAt));

/** How often the page asks how a phone call is going, and when it gives up waiting. */
const PHONE_POLL_MS = 2000;
const PHONE_GIVE_UP_MS = 9 * 60_000;

/** The few sentences this hook says itself, in the call's language. */
const SESSION_COPY = {
  en: {
    noBankWords: "That call ended before the bank said anything, so there was no result to read.",
    stoppedEarly: "You stopped following before the bank said anything. If the phone is still ringing or on, just hang up.",
    noConnect: "The phone call did not connect.",
    unanswered: {
      "Nobody picked up.": "Nobody picked up.",
      "The line was busy.": "The line was busy.",
      "The call went to voicemail, so the agent hung up.": "The call went to voicemail, so the agent hung up.",
      "The call could not be connected.": "The call could not be connected.",
    } as Record<string, string>,
  },
  es: {
    noBankWords: "La llamada terminó antes de que el banco dijera algo, así que no hay resultado que leer.",
    stoppedEarly: "Dejaste de seguir la llamada antes de que el banco dijera algo. Si el teléfono sigue sonando o en línea, solo cuelga.",
    noConnect: "La llamada no se conectó.",
    unanswered: {
      "Nobody picked up.": "Nadie contestó.",
      "The line was busy.": "La línea estaba ocupada.",
      "The call went to voicemail, so the agent hung up.": "La llamada se fue al buzón de voz, así que el agente colgó.",
      "The call could not be connected.": "No se pudo conectar la llamada.",
    } as Record<string, string>,
  },
};

const sameTurns = (a: Turn[], b: Turn[]) =>
  a.length === b.length && a.every((turn, index) => turn.role === b[index].role && turn.text === b[index].text);
const bankSpoke = (call: CallRecord) => call.turns.some((turn) => turn.role === "bank");

export function useCallSession(input: {
  card: CardAccount;
  brief: NegotiationBrief;
  /** Called once the outcome and the savings are stored on the call. */
  onResult: (callId: string) => void;
}): CallSession {
  const { card, brief, onResult } = input;
  const { update } = useCaseFile();

  const [call, setCall] = useState<CallRecord | null>(null);
  const [phase, setPhase] = useState<CallPhase>("briefing");
  const [agentIsReplying, setAgentIsReplying] = useState(false);
  const [problem, setProblem] = useState<CallProblem | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [phoneStatus, setPhoneStatus] = useState<CallSession["phone"]["status"]>("idle");
  const [transferred, setTransferred] = useState(false);
  const [withCardholder, setWithCardholder] = useState(false);
  /** The phone call being followed. Clearing it stops the polling. */
  const phoneCall = useRef<{ conversationId: string; startedAtMs: number } | null>(null);
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** The last phone call placed. Kept after polling stops, so the end of the call can read its transcript once more. */
  const lastConversation = useRef<string | null>(null);

  const stopPolling = useCallback(() => {
    phoneCall.current = null;
    if (pollTimer.current) clearTimeout(pollTimer.current);
    pollTimer.current = null;
  }, []);
  // Leaving the page stops the polling. The phone call itself carries on until someone hangs up.
  useEffect(() => stopPolling, [stopPolling]);

  // The requests below outlive the render that sent them, so they read the call from a ref, not from state.
  const latest = useRef<CallRecord | null>(null);
  /** True from the moment the call ends: no more turns are taken and no second outcome request is sent. */
  const closing = useRef(false);

  /** Keep the call in state and mirror it into the case file as it grows. An empty call is not worth saving. */
  const commit = useCallback(
    (next: CallRecord) => {
      latest.current = next;
      setCall(next);
      if (next.turns.length > 0) update((current) => (current ? withCall(current, next) : current));
    },
    [update],
  );

  const addTurn = useCallback(
    (turn: Turn) => {
      const current = latest.current;
      if (current && !closing.current) commit({ ...current, turns: [...current.turns, turn] });
    },
    [commit],
  );

  /** End the call, read the outcome from the transcript and store it with the savings. */
  const close = useCallback(async () => {
    const current = latest.current;
    if (!current || closing.current) return;
    closing.current = true;
    setAgentIsReplying(false);
    setProblem(null);

    // A phone call's last lines can arrive after the page stopped following it (the visitor pressed stop,
    // or a status check failed). Read the transcript again, a few times, before deciding the bank said nothing.
    /** The line was still up when the page stopped following it. */
    let stillLive = false;
    if (current.mode === "phone" && !bankSpoke(current) && lastConversation.current) {
      setPhase("reading");
      for (let attempt = 0; attempt < 4; attempt += 1) {
        const result = await fetchPhoneStatus(lastConversation.current);
        if (result.ok) stillLive = result.data.status === "dialing" || result.data.status === "live";
        if (result.ok && result.data.turns.some((turn) => turn.role === "bank")) {
          commit({ ...current, turns: result.data.turns, ...(result.data.transferred ? { handedOff: true } : {}) });
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
    }

    if (!bankSpoke(latest.current ?? current)) {
      // With no word from the bank there is nothing to read, so the call is dropped, not sent for a result.
      latest.current = null;
      setCall(null);
      update((stored) => (stored ? { ...stored, calls: stored.calls.filter((kept) => kept.id !== current.id) } : stored));
      setPhase("briefing");
      const copy = SESSION_COPY[brief.language ?? "en"];
      setNotice(stillLive ? copy.stoppedEarly : copy.noBankWords);
      return;
    }

    const read = latest.current ?? current;
    const ended: CallRecord = { ...read, endedAt: read.endedAt ?? new Date().toISOString() };
    commit(ended);
    setPhase("reading");

    const result = await fetchOutcome(brief, ended.turns);
    if (!result.ok) {
      closing.current = false;
      setProblem({ message: result.error, retry: "outcome" });
      return;
    }

    let savings: Savings;
    try {
      savings = savingsFromOutcome(card, result.data.outcome);
    } catch {
      closing.current = false;
      setProblem({ message: "We read the call but could not work out the savings. Please try again.", retry: "outcome" });
      return;
    }

    commit({ ...ended, outcome: result.data.outcome, savings });
    setPhase("done");
    onResult(ended.id);
  }, [brief, card, commit, onResult, update]);

  const voice = useVoiceCall({
    brief,
    onTurn: addTurn,
    onEnd: useCallback(
      (reason: "user" | "agent" | "error") => {
        // After a voice error with nothing heard from the bank, the call stays open so the visitor can type instead.
        const current = latest.current;
        if (reason === "error" && !(current && bankSpoke(current))) return;
        void close();
      },
      [close],
    ),
  });

  /** A phone call that never got going: back to the briefing with one sentence on why. */
  const dropCall = useCallback(
    (why: string) => {
      stopPolling();
      const current = latest.current;
      latest.current = null;
      setCall(null);
      if (current) update((stored) => (stored ? { ...stored, calls: stored.calls.filter((kept) => kept.id !== current.id) } : stored));
      setPhoneStatus("idle");
      setPhase("briefing");
      setNotice(why);
    },
    [stopPolling, update],
  );

  /**
   * Follow one phone call: every two seconds take its transcript, until the line is down, the visitor
   * stops following, or the call runs past the limit. Then close it like any other call.
   */
  const followPhone = useCallback(
    async (following: { conversationId: string; startedAtMs: number }) => {
      const stillFollowing = () => phoneCall.current === following && !closing.current;
      while (stillFollowing()) {
        await new Promise((resolve) => {
          pollTimer.current = setTimeout(resolve, PHONE_POLL_MS);
        });
        if (!stillFollowing()) return;

        const result = await fetchPhoneStatus(following.conversationId);
        if (!stillFollowing()) return;
        if (result.ok) {
          const { status, reason, turns } = result.data;
          setPhoneStatus(status);
          if (result.data.transferred) setTransferred(true);
          const current = latest.current;
          const handedOff = result.data.transferred && !current?.handedOff;
          if (current && (handedOff || !sameTurns(current.turns, turns))) {
            commit({ ...current, turns, ...(result.data.transferred ? { handedOff: true } : {}) });
          }
          if (status === "failed") {
            const copy = SESSION_COPY[brief.language ?? "en"];
            dropCall(reason ? (copy.unanswered[reason] ?? reason) : copy.noConnect);
            return;
          }
          if (status === "done") {
            // Handed to the cardholder: they are still on with the bank, with the live coach.
            // The call is read when they say they are off the phone (end).
            if (result.data.transferred) {
              stopPolling();
              return;
            }
            break;
          }
        }
        if (Date.now() - following.startedAtMs > PHONE_GIVE_UP_MS) break;
      }
      if (phoneCall.current !== following) return;
      stopPolling();
      void close();
    },
    [brief.language, close, commit, dropCall, stopPolling],
  );

  async function ringPhone(toNumber: string, voiceId?: string, cardholderNumber?: string) {
    setPhoneStatus("placing");
    lastConversation.current = null;
    setTransferred(false);
    setWithCardholder(Boolean(cardholderNumber));
    const result = await startPhoneCall({ brief, toNumber, voiceId, cardholderNumber });
    if (closing.current) return;
    if (!result.ok) {
      dropCall(result.error);
      return;
    }
    setPhoneStatus("dialing");
    const following = { conversationId: result.data.conversationId, startedAtMs: Date.now() };
    lastConversation.current = following.conversationId;
    phoneCall.current = following;
    void followPhone(following);
  }

  /** Ask for the agent's next line. With no turns yet, the server answers with the opening line. */
  async function askAgent() {
    const asked = latest.current;
    if (!asked || closing.current) return;
    setAgentIsReplying(true);
    setProblem(null);

    const result = await fetchAgentReply(brief, asked.turns);
    // The visitor may have ended this call, or started another, while the agent was thinking.
    if (closing.current || latest.current?.id !== asked.id) return;
    setAgentIsReplying(false);
    if (!result.ok) {
      setProblem({ message: result.error, retry: "reply" });
      return;
    }
    addTurn({ role: "agent", text: result.data.reply, at: msSinceStart(asked) });
    if (result.data.done) void close();
  }

  function start(mode: CallMode, voiceId?: string, toNumber?: string, cardholderNumber?: string) {
    closing.current = false;
    setProblem(null);
    setNotice(null);
    setPhase("live");
    commit(newCall({ cardId: card.id, goal: brief.goal, mode }));
    const speaker = spokenVoiceId(voiceId, brief.language);
    if (mode === "text") void askAgent();
    else if (mode === "phone") void ringPhone(toNumber ?? "", speaker, cardholderNumber);
    else void voice.start(speaker);
  }

  function say(text: string) {
    const current = latest.current;
    const line = text.trim();
    if (!current || line === "") return;
    addTurn({ role: "bank", text: line, at: msSinceStart(current) });
    void askAgent();
  }

  function end() {
    if (latest.current?.mode === "voice") void voice.stop();
    // A phone call cannot be hung up from here. Stop following it and read what was said so far.
    if (latest.current?.mode === "phone") stopPolling();
    void close();
  }

  function typeInstead() {
    const current = latest.current;
    if (!current) return;
    void voice.stop();
    commit({ ...current, mode: "text" });
    // The agent speaks next, unless it already had the last word.
    if (current.turns.at(-1)?.role !== "agent") void askAgent();
  }

  function reset() {
    stopPolling();
    setPhoneStatus("idle");
    closing.current = false;
    latest.current = null;
    setCall(null);
    setProblem(null);
    setAgentIsReplying(false);
    setPhase("briefing");
  }

  return {
    phase,
    mode: call?.mode ?? null,
    turns: call?.turns ?? [],
    callId: call?.id ?? null,
    startedAtMs: call ? Date.parse(call.startedAt) : null,
    agentIsReplying,
    problem,
    notice,
    voice: { status: voice.status, error: voice.error },
    phone: { status: phoneStatus, transferred, withCardholder },
    start,
    say,
    retry: () => void (problem?.retry === "outcome" ? close() : askAgent()),
    end,
    typeInstead,
    reset,
  };
}
