"use client";

// The share preview on the win screen. It asks /api/share for a signed link (the server re-checks the call
// first), then shows the card and four ways to share it. Renders nothing for a call that did not win money.
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { EASE } from "@/components/motion/reveal";
import { isSampleCard } from "@/components/start/sample-cards";
import { buttonVariants } from "@/components/ui/button";
import { outcomeKind } from "@/components/win/outcome-kind";
import { siteUrl } from "@/lib/benchmarks/site";
import type { Copy } from "@/lib/i18n/locale";
import { useLocale } from "@/lib/i18n/use-locale";
import { decodePayload, type SharePayload } from "@/lib/share/payload";
import type { CardStatus } from "@/lib/share/sign";
import { shareText } from "@/lib/share/text";
import type { CallOutcome, CallRecord, CardAccount, Savings } from "@/lib/types";
import { cn } from "@/lib/utils";
import { WinCard } from "./win-card";

type ShareCopy = { title: string; lead: string; x: string; linkedin: string; copy: string; copied: string; download: string; failed: string; making: string };

const COPY: Copy<ShareCopy> = {
  en: {
    title: "Share your win",
    lead: "The card shows the bank, what it granted and what it saves. Never your name or card number.",
    x: "Share on X",
    linkedin: "Share on LinkedIn",
    copy: "Copy link",
    copied: "Link copied",
    download: "Download image",
    failed: "We could not make a share link just now. Your win is saved either way.",
    making: "Making your card",
  },
  es: {
    title: "Comparte tu victoria",
    lead: "La tarjeta muestra el banco, lo que concedió y lo que ahorra. Nunca tu nombre ni el número de tu tarjeta.",
    x: "Compartir en X",
    linkedin: "Compartir en LinkedIn",
    copy: "Copiar enlace",
    copied: "Enlace copiado",
    download: "Descargar imagen",
    failed: "No pudimos crear el enlace en este momento. Tu victoria quedó guardada de todos modos.",
    making: "Creando tu tarjeta",
  },
};

type Ready = { url: string; token: string; payload: SharePayload; status: CardStatus };

/** A signed token is "<payload>.<signature>". The server checks the signature; here it only tells us one exists. */
function statusOf(token: string, payload: SharePayload): CardStatus {
  if (!token.includes(".")) return "unverified";
  return payload.practice ? "practice" : "verified";
}

export function ShareWin({
  call,
  card,
  outcome,
  savings,
  bankName,
}: {
  call: CallRecord;
  card: CardAccount;
  outcome: CallOutcome;
  savings: Savings | null;
  bankName: string;
}) {
  const copy = COPY[useLocale()];
  const shareable = outcomeKind(outcome) === "win" && savings !== null && savings.annualSavingsCents > 0;
  const [state, setState] = useState<{ kind: "loading" } | { kind: "failed" } | ({ kind: "ready" } & Ready)>({ kind: "loading" });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!shareable) return;
    const controller = new AbortController();
    const { verified: _verified, ...draft } = outcome;
    void _verified;
    fetch("/api/share", {
      method: "POST",
      signal: controller.signal,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        bank: bankName,
        card: {
          purchaseAprBps: card.purchaseAprBps,
          balanceCents: card.balanceCents,
          annualFeeCents: card.annualFeeCents,
          aprBeforeMissBps: card.missedPayment?.aprBeforeBps ?? null,
        },
        outcome: draft,
        turns: call.turns,
        sample: isSampleCard(card),
      }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(String(res.status));
        const { url, token } = (await res.json()) as { url: string; token: string };
        const payload = decodePayload(token.split(".")[0]);
        if (!payload) throw new Error("unreadable");
        setState({ kind: "ready", url, token, payload, status: statusOf(token, payload) });
      })
      .catch((error: unknown) => {
        if ((error as Error).name !== "AbortError") setState({ kind: "failed" });
      });
    return () => controller.abort();
  }, [shareable, call.turns, card, outcome, bankName]);

  if (!shareable) return null;

  const domain = new URL(siteUrl()).host;
  const action = cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full sm:w-auto");

  return (
    <section aria-label={copy.title} className="flex flex-col gap-4 rounded-[28px] border border-line bg-card p-5 sm:p-7">
      <div className="flex flex-col gap-1">
        <h2 className="text-[22px] leading-7 font-semibold tracking-[-0.03em] text-ink">{copy.title}</h2>
        <p className="text-[14px] leading-5 font-medium text-muted">{copy.lead}</p>
      </div>

      {state.kind === "loading" && <div aria-label={copy.making} className="hg-shimmer h-[320px] w-full max-w-[560px] rounded-[32px]" />}
      {state.kind === "failed" && <p className="text-[14px] leading-5 font-medium text-alarm">{copy.failed}</p>}
      {state.kind === "ready" && (
        <>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }} className="w-full max-w-[560px]">
            <WinCard payload={state.payload} status={state.status} domain={domain} />
          </motion.div>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <a
              className={action}
              target="_blank"
              rel="noopener noreferrer"
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText(state.payload))}&url=${encodeURIComponent(state.url)}`}
            >
              {copy.x}
            </a>
            <a className={action} target="_blank" rel="noopener noreferrer" href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(state.url)}`}>
              {copy.linkedin}
            </a>
            <button
              type="button"
              className={action}
              onClick={() => {
                void navigator.clipboard?.writeText(state.url).then(() => setCopied(true));
              }}
            >
              {copied ? copy.copied : copy.copy}
            </button>
            <a className={action} href={`/w/${state.token}/story?download=1`} download>
              {copy.download}
            </a>
          </div>
        </>
      )}
    </section>
  );
}
