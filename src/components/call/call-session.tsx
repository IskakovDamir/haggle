"use client";

import { useCallback, useMemo, useState } from "react";
import { Headphones } from "lucide-react";
import { useRouter } from "next/navigation";
import { MotionConfig } from "framer-motion";
import { Stagger, StaggerItem } from "@/components/motion/reveal";
import type { Copy } from "@/lib/i18n/locale";
import { useLocale } from "@/lib/i18n/use-locale";
import { cleanRequest } from "@/lib/negotiator/own-request";
import type { CardAccount, NegotiationBrief } from "@/lib/types";
import { askPoints, cardLabel } from "./ask";
import { BankGuide } from "./bank-guide";
import { bankReplies } from "./bank-replies";
import { CoachPanel } from "./coach-panel";
import { Button } from "@/components/ui/button";
import { CallPanel, type LineState } from "./call-panel";
import { formatClock, useElapsedMs } from "./clock";
import { LiveControls } from "./live-controls";
import { StartControls } from "./start-controls";
import { Transcript } from "./transcript";
import { useCallSession, type CallSession as Session } from "./use-call-session";
import { useCapabilities } from "./use-capabilities";

const COPY: Copy<{
  practice: string;
  calls: string;
  about: (holder: string, card: string) => string;
  bankLabel: string;
  phoneEmpty: string;
  agentFirst: string;
  soloAsk: string;
  soloOpen: string;
  soloBack: string;
  offCall: string;
}> = {
  en: {
    practice: "Practice call",
    calls: "Haggle calls",
    about: (holder, card) => `About ${holder}'s ${card}.`,
    bankLabel: "You, as the bank",
    phoneEmpty: "The transcript shows up here as the call goes.",
    agentFirst: "The agent speaks first.",
    soloAsk: "Rather call the bank yourself?",
    soloOpen: "Get live tips",
    soloBack: "Back",
    offCall: "I'm off the call",
  },
  es: {
    practice: "Llamada de práctica",
    calls: "Haggle llama a",
    about: (holder, card) => `Sobre la tarjeta ${card} de ${holder}.`,
    bankLabel: "Tú, como el banco",
    phoneEmpty: "La transcripción aparece aquí mientras avanza la llamada.",
    agentFirst: "El agente habla primero.",
    soloAsk: "¿Prefieres llamar tú al banco?",
    soloOpen: "Consejos en vivo",
    soloBack: "Volver",
    offCall: "Ya colgué",
  },
};

/** What the bar at the top of the panel says about the line. */
function lineState(session: Session): LineState {
  if (session.phase === "briefing") return "ready";
  if (session.phase !== "live") return "ended";
  if (session.mode === "phone") {
    const status = session.phone.status;
    if (status === "live") return "live";
    return status === "wrapping" || status === "done" || status === "failed" ? "ended" : "connecting";
  }
  if (session.mode !== "voice") return "live";
  if (session.voice.status === "live") return "live";
  return session.voice.status === "connecting" || session.voice.status === "idle" ? "connecting" : "ended";
}

/** One practice call about one plan step: the briefing, the live transcript, and the hand-off to the result. */
export function CallSession(props: { card: CardAccount; brief: NegotiationBrief; demo?: boolean }) {
  const router = useRouter();
  const locale = useLocale();
  const copy = COPY[locale];
  // The call runs on the card as it stood when this screen opened. The case file is saved again with
  // every line, and a brief that changed identity mid-call would only disturb the voice session.
  const [{ card, brief: suggested }] = useState(props);
  /** The cardholder's own words for the ask, as typed. Empty means the suggested ask. */
  const [requestText, setRequestText] = useState("");
  const request = cleanRequest(requestText);
  const brief = useMemo<NegotiationBrief>(() => (request ? { ...suggested, request } : suggested), [request, suggested]);

  const showResult = useCallback(
    (callId: string) => router.push(`/win?call=${encodeURIComponent(callId)}`),
    [router],
  );
  const session = useCallSession({ card, brief, onResult: showResult });
  const capabilities = useCapabilities();
  const elapsedMs = useElapsedMs(session.startedAtMs, session.phase === "live");
  const replies = useMemo(() => bankReplies(brief, card, brief.language ?? "en"), [brief, card]);
  /** The cardholder calls the bank themselves and the coach gives tips. No agent, no call record. */
  const [solo, setSolo] = useState(false);
  /** The agent handed the call over: the cardholder is on with the bank, and the coach takes over the panel. */
  const handedOff = session.phase === "live" && session.mode === "phone" && session.phone.transferred;

  return (
    <MotionConfig reducedMotion="user">
      <Stagger as="header" onMount gap={0.08} className="mb-7 sm:mb-10">
        <StaggerItem
          as="h1"
          className="text-[clamp(34px,5.5vw,56px)] leading-[1.05] font-semibold tracking-[-0.035em] text-hg-ink"
        >
          {copy.calls} <em>{brief.issuerName}</em>
        </StaggerItem>
        <StaggerItem as="p" className="mt-3 text-[17px] leading-7 font-medium text-muted sm:text-lg">
          {copy.about(brief.holderFirstName, cardLabel(card, locale))}
        </StaggerItem>
      </Stagger>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,23rem)] lg:gap-8">
        <CallPanel line={lineState(session)} callee={brief.issuerName} clock={formatClock(elapsedMs)}>
          {session.phase === "briefing" && solo ? (
            <CoachPanel
              brief={brief}
              earlier={[]}
              handoff={false}
              footer={
                <Button variant="ghost" size="lg" onClick={() => setSolo(false)}>
                  {copy.soloBack}
                </Button>
              }
            />
          ) : session.phase === "briefing" ? (
            <>
              <StartControls
                ask={askPoints(suggested, card, locale)}
                request={requestText}
                onRequest={setRequestText}
                demo={props.demo ?? false}
                bankName={brief.issuerName}
                capabilities={capabilities}
                voice={session.voice}
                notice={session.notice}
                onStart={session.start}
              />
              {capabilities.status === "ready" && capabilities.capabilities.voice && capabilities.capabilities.negotiation && (
                <p className="mt-4 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm font-medium text-hg-muted">
                  {copy.soloAsk}
                  <button
                    type="button"
                    onClick={() => setSolo(true)}
                    className="inline-flex items-center gap-1.5 font-semibold text-hg-blue underline-offset-4 hover:underline"
                  >
                    <Headphones className="size-4" aria-hidden />
                    {copy.soloOpen}
                  </button>
                </p>
              )}
            </>
          ) : handedOff ? (
            <CoachPanel
              brief={brief}
              earlier={session.turns}
              handoff
              footer={
                <Button variant="outline" size="lg" onClick={session.end}>
                  {copy.offCall}
                </Button>
              }
            />
          ) : (
            <>
              <Transcript
                turns={session.turns}
                bankLabel={copy.bankLabel}
                agentIsReplying={session.agentIsReplying}
                follow
                emptyText={session.mode === "phone" ? copy.phoneEmpty : copy.agentFirst}
                className="h-[min(26rem,52vh)]"
              />
              <LiveControls session={session} replies={replies} />
            </>
          )}
        </CallPanel>

        <BankGuide brief={brief} />
      </div>
    </MotionConfig>
  );
}
