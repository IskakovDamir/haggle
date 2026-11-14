"use client";

// One practice call from "Start" to a stored result.
//
//   briefing -> live -> reading -> done
//
// The agent's lines come from /api/negotiate (typed call) or from the voice hook (spoken call).
// When the call ends, /api/outcome reads the transcript and the engine turns the outcome into savings.
import { useCallback, useRef, useState } from "react";
import { savingsFromOutcome } from "@/lib/engine";
import { newCall, useCaseFile, withCall } from "@/lib/store";
import type { CallRecord, CardAccount, NegotiationBrief, Savings, Turn } from "@/lib/types";
import { useVoiceCall, type VoiceStatus } from "@/lib/voice/use-voice-call";
import { fetchAgentReply, fetchOutcome } from "./api";

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
  start: (mode: CallMode) => void;
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

    if (!bankSpoke(current)) {
      // With no word from the bank there is nothing to read, so the call is dropped, not sent for a result.
      latest.current = null;
      setCall(null);
      update((stored) => (stored ? { ...stored, calls: stored.calls.filter((kept) => kept.id !== current.id) } : stored));
      setPhase("briefing");
      setNotice("That call ended before the bank said anything, so there was no result to read.");
      return;
    }

    const ended: CallRecord = { ...current, endedAt: current.endedAt ?? new Date().toISOString() };
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

  function start(mode: CallMode, voiceId?: string) {
    closing.current = false;
    setProblem(null);
    setNotice(null);
    setPhase("live");
    commit(newCall({ cardId: card.id, goal: brief.goal, mode }));
    if (mode === "text") void askAgent();
    else void voice.start(voiceId);
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
    start,
    say,
    retry: () => void (problem?.retry === "outcome" ? close() : askAgent()),
    end,
    typeInstead,
    reset,
  };
}
