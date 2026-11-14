"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { MotionConfig } from "framer-motion";
import { Stagger, StaggerItem } from "@/components/motion/reveal";
import { Badge } from "@/components/ui/primitives";
import type { CardAccount, NegotiationBrief } from "@/lib/types";
import { askSentence, cardLabel } from "./ask";
import { BankGuide } from "./bank-guide";
import { CallPanel, type LineState } from "./call-panel";
import { formatClock, useElapsedMs } from "./clock";
import { LiveControls } from "./live-controls";
import { StartControls } from "./start-controls";
import { Transcript } from "./transcript";
import { useCallSession, type CallSession as Session } from "./use-call-session";
import { useCapabilities } from "./use-capabilities";

/** What the bar at the top of the panel says about the line. */
function lineState(session: Session): LineState {
  if (session.phase === "briefing") return "ready";
  if (session.phase !== "live") return "ended";
  if (session.mode !== "voice") return "live";
  if (session.voice.status === "live") return "live";
  return session.voice.status === "connecting" || session.voice.status === "idle" ? "connecting" : "ended";
}

/** One practice call about one plan step: the briefing, the live transcript, and the hand-off to the result. */
export function CallSession(props: { card: CardAccount; brief: NegotiationBrief }) {
  const router = useRouter();
  // The call runs on the card as it stood when this screen opened. The case file is saved again with
  // every line, and a brief that changed identity mid-call would only disturb the voice session.
  const [{ card, brief }] = useState(props);

  const showResult = useCallback(
    (callId: string) => router.push(`/win?call=${encodeURIComponent(callId)}`),
    [router],
  );
  const session = useCallSession({ card, brief, onResult: showResult });
  const capabilities = useCapabilities();
  const elapsedMs = useElapsedMs(session.startedAtMs, session.phase === "live");

  return (
    <MotionConfig reducedMotion="user">
      <Stagger as="header" onMount gap={0.08} className="mb-7 sm:mb-10">
        <StaggerItem>
          <Badge tone="lime" className="px-3 py-1">
            Practice call
          </Badge>
        </StaggerItem>
        <StaggerItem
          as="h1"
          className="mt-4 text-[clamp(34px,5.5vw,56px)] leading-[1.05] font-semibold tracking-[-0.035em] text-hg-ink"
        >
          Haggle calls <em>{brief.issuerName}</em>
        </StaggerItem>
        <StaggerItem as="p" className="mt-3 text-[17px] leading-7 font-medium text-muted sm:text-lg">
          About {brief.holderFirstName}&apos;s {cardLabel(card)}.
        </StaggerItem>
      </Stagger>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,23rem)] lg:gap-8">
        <CallPanel line={lineState(session)} callee={brief.issuerName} clock={formatClock(elapsedMs)}>
          {session.phase === "briefing" ? (
            <StartControls
              ask={askSentence(brief, card)}
              capabilities={capabilities}
              voice={session.voice}
              notice={session.notice}
              onStart={session.start}
            />
          ) : (
            <>
              <Transcript
                turns={session.turns}
                bankLabel="You, as the bank"
                agentIsReplying={session.agentIsReplying}
                follow
                emptyText="The agent speaks first."
                className="h-[min(26rem,52vh)]"
              />
              <LiveControls session={session} />
            </>
          )}
        </CallPanel>

        <BankGuide brief={brief} />
      </div>
    </MotionConfig>
  );
}
