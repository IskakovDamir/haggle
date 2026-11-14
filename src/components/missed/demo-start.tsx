"use client";

// /demo: one click from the landing to a call. Saves Maria's sample card (labelled as sample data on
// every screen that shows it) and opens the call with typing picked, so a visitor can play the bank
// right away with the suggested replies.
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { callHref } from "@/components/call/resolve-call";
import { PageSkeleton } from "@/components/call/page-states";
import { newCase, useCaseFile, withCard } from "@/lib/store";
import { SAMPLE_MISSED, SAMPLE_MISSED_CARD_ID, readMissedForm } from "./missed-model";

export function DemoStart() {
  const router = useRouter();
  const { ready, update } = useCaseFile();
  const started = useRef(false);

  useEffect(() => {
    if (!ready || started.current) return;
    started.current = true;
    const sample = readMissedForm(SAMPLE_MISSED, { id: SAMPLE_MISSED_CARD_ID, thisYear: new Date().getFullYear() });
    if (!sample.ok) {
      router.replace("/missed");
      return;
    }
    const { card, holderFirstName } = sample;
    update((current) => (current ? { ...withCard(current, card), holderFirstName } : newCase(holderFirstName, card)));
    router.replace(`${callHref(`${card.id}:missed_payment`)}&demo=1`);
  }, [ready, router, update]);

  return <PageSkeleton />;
}
