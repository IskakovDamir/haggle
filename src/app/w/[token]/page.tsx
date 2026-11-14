import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { sectionPad } from "@/components/insights/chrome";
import { HgButton, HgSection } from "@/components/landing-v2/ui";
import { WinCard } from "@/components/share/win-card";
import { sharedCard } from "@/lib/share/read";
import { shareText, winLine } from "@/lib/share/text";
import { cn } from "@/lib/utils";

export async function generateMetadata({ params }: PageProps<"/w/[token]">): Promise<Metadata> {
  const card = await sharedCard((await params).token);
  if (!card) return { title: "Haggle" };
  // An edited or unsigned card never repeats its numbers in the link preview text.
  const unverified = card.status === "unverified";
  const title = unverified ? "Unverified Haggle win card" : `${card.payload.bank}: ${winLine(card.payload.wins[0])}`;
  const description = unverified ? "We could not verify this card. Its numbers may have been edited." : shareText(card.payload);
  return { title, description, openGraph: { title, description }, twitter: { card: "summary_large_image", title, description } };
}

const NOTE = {
  verified: "Code checked every number on this card against what the bank said on the call.",
  practice: "This was a practice call: the person on the other end played the bank. Code checked every number against what they said.",
  unverified: "We could not verify this card. It may have been edited, so treat its numbers with care.",
} as const;

// The token is read inside Suspense so the page shell shows at once; there are no static tokens to prerender.
export default function SharedWinPage({ params }: PageProps<"/w/[token]">) {
  return (
    <Suspense fallback={<div className="min-h-[70vh]" />}>
      <SharedWin params={params} />
    </Suspense>
  );
}

async function SharedWin({ params }: { params: PageProps<"/w/[token]">["params"] }) {
  const card = await sharedCard((await params).token);
  if (!card) notFound();
  return (
    <HgSection className={cn("flex flex-col items-center gap-8 py-12 lg:py-16", sectionPad)}>
      <WinCard payload={card.payload} status={card.status} domain={card.domain} className="w-full max-w-[640px]" />
      <p className="max-w-[60ch] text-center text-[15px] leading-6 font-medium text-hg-muted">{NOTE[card.status]}</p>
      <div className="flex max-w-[640px] flex-col items-center gap-5 text-center">
        <p className="text-[clamp(22px,3vw,28px)] leading-[1.25] font-semibold tracking-[-0.03em] text-hg-ink">
          Haggle is an AI agent that calls your card issuer for you. <em>It asks for fees back and lower rates, and charges only after a win.</em>
        </p>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <HgButton href="/missed" arrow>
            Get your own fee back
          </HgButton>
          <HgButton href="/start" tone="dark" arrow>
            Lower your own rate
          </HgButton>
        </div>
      </div>
    </HgSection>
  );
}
