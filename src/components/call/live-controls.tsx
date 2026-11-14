"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, LoaderCircle, Mic, PhoneOff, SendHorizontal } from "lucide-react";
import { EASE } from "@/components/motion/reveal";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";
import { Notice } from "./page-states";
import { panel } from "./panel-theme";
import type { CallSession } from "./use-call-session";

/** The longest line the negotiate route accepts. */
const MAX_LINE_CHARS = 1000;

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
export function LiveControls({ session }: { session: CallSession }) {
  const { phase, mode, problem, voice } = session;

  if (phase === "done") {
    return (
      <Phase id="done" className="flex flex-col gap-2 sm:flex-row">
        <Link
          href={`/win?call=${encodeURIComponent(session.callId ?? "")}`}
          className={cn(buttonVariants({ size: "lg" }), "group flex-1")}
        >
          See the result
          <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
        </Link>
        <Button size="lg" variant="ghost" onClick={session.reset}>
          Call again
        </Button>
      </Phase>
    );
  }

  if (phase === "reading") {
    return problem ? (
      <Phase id="reading-problem" className="flex flex-col gap-3">
        <Notice tone="dark">{problem.message}</Notice>
        <Button size="lg" onClick={session.retry}>
          Read the call again
        </Button>
      </Phase>
    ) : (
      <Phase id="reading">
        <p
          role="status"
          className="hg-shimmer flex items-center gap-2.5 rounded-2xl px-4 py-3 text-[15px] font-medium text-hg-ink-2"
        >
          <LoaderCircle className="size-4 shrink-0 animate-spin text-hg-blue" aria-hidden />
          Reading the call. Every number is checked against the bank&apos;s own words.
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
            Try again
          </Button>
        </div>
      )}

      {voiceFailed && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Notice tone="dark" className="flex-1">
            {voice.error ?? "The voice call could not start."} You can carry on by typing.
          </Notice>
          <Button variant="outline" onClick={session.typeInstead}>
            Type instead
          </Button>
        </div>
      )}

      {mode === "text" && <BankComposer session={session} />}

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
          {micLive
            ? "The microphone is on. Speak as the bank."
            : "Connecting the call. Allow the microphone if your browser asks."}
        </p>
      )}

      <Button variant="danger" size="lg" onClick={session.end}>
        <PhoneOff className="size-4" aria-hidden />
        End call
      </Button>
    </Phase>
  );
}

/** Where the visitor types the bank's next line. It opens only when it is the bank's turn to speak. */
function BankComposer({ session }: { session: CallSession }) {
  const [draft, setDraft] = useState("");
  const banksTurn = !session.agentIsReplying && session.turns.at(-1)?.role === "agent";
  const canSend = banksTurn && draft.trim() !== "";

  return (
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
        Your line, as the bank
      </label>
      <Input
        id="bank-line"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        maxLength={MAX_LINE_CHARS}
        autoComplete="off"
        placeholder={banksTurn ? "Answer as the bank" : "Wait for the agent"}
        className={cn("rounded-full", panel.field, banksTurn && "border-hg-blue-tint bg-white")}
      />
      <Button type="submit" disabled={!canSend} aria-label="Say it" className="size-11 shrink-0 px-0">
        <SendHorizontal className="size-4" aria-hidden />
      </Button>
    </form>
  );
}
