"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, LoaderCircle, Mic, PhoneOff, SendHorizontal } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";
import { Notice } from "./page-states";
import { panel } from "./panel-theme";
import type { CallSession } from "./use-call-session";

/** The longest line the negotiate route accepts. */
const MAX_LINE_CHARS = 1000;

const limeButton = "bg-lime text-ink hover:bg-lime/90";

/** The row under the transcript. It changes with the call: speak or type, wait for the result, or move on. */
export function LiveControls({ session }: { session: CallSession }) {
  const { phase, mode, problem, voice } = session;

  if (phase === "done") {
    return (
      <div className="flex flex-col gap-2 sm:flex-row">
        <Link
          href={`/win?call=${encodeURIComponent(session.callId ?? "")}`}
          className={cn(buttonVariants({ size: "lg" }), limeButton, "flex-1")}
        >
          See the result
          <ArrowRight className="size-4" aria-hidden />
        </Link>
        <Button size="lg" variant="ghost" className="text-[#e9e8e3] hover:bg-white/10" onClick={session.reset}>
          Call again
        </Button>
      </div>
    );
  }

  if (phase === "reading") {
    return problem ? (
      <div className="flex flex-col gap-3">
        <Notice tone="dark">{problem.message}</Notice>
        <Button size="lg" className={limeButton} onClick={session.retry}>
          Read the call again
        </Button>
      </div>
    ) : (
      <p role="status" className="flex items-center gap-2.5 text-[15px]">
        <LoaderCircle className="size-4 shrink-0 animate-spin text-lime" aria-hidden />
        Reading the call. Every number is checked against the bank&apos;s own words.
      </p>
    );
  }

  const voiceFailed = mode === "voice" && (voice.status === "error" || voice.status === "unavailable");

  return (
    <div className="flex flex-col gap-3">
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
        <p role="status" className={cn("flex items-center gap-2.5 text-[15px]", panel.dim)}>
          <Mic className={cn("size-4 shrink-0", voice.status === "live" && "animate-pulse text-lime")} aria-hidden />
          {voice.status === "live"
            ? "The microphone is on. Speak as the bank."
            : "Connecting the call. Allow the microphone if your browser asks."}
        </p>
      )}

      <Button variant="danger" size="lg" onClick={session.end}>
        <PhoneOff className="size-4" aria-hidden />
        End call
      </Button>
    </div>
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
        className={cn("rounded-full", panel.field)}
      />
      <Button
        type="submit"
        disabled={!canSend}
        aria-label="Say it"
        className={cn(limeButton, "size-11 shrink-0 px-0")}
      >
        <SendHorizontal className="size-4" aria-hidden />
      </Button>
    </form>
  );
}
