"use client";

import { useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "@/lib/i18n/use-locale";
import { useCaseFile } from "@/lib/store";
import type { CaseFile } from "@/lib/types";
import { CallSession } from "./call-session";
import { useToday } from "./clock";
import { EmptyState, PageSkeleton } from "./page-states";
import { callHref, resolveCall } from "./resolve-call";

/** "/call?step=<cardId>:<kind>": finds the plan step in the visitor's case and runs the call for it. */
export function CallScreen() {
  const params = useSearchParams();
  const stepParam = params.get("step");
  const demo = params.get("demo") === "1";
  const { caseFile, ready } = useCaseFile();

  if (!ready) return <PageSkeleton />;
  if (!caseFile || caseFile.cards.length === 0) {
    return <EmptyState title="No statement yet">Haggle needs a card statement before it can call anyone.</EmptyState>;
  }
  return <PlannedCall caseFile={caseFile} stepParam={stepParam} demo={demo} />;
}

function PlannedCall({ caseFile, stepParam, demo }: { caseFile: CaseFile; stepParam: string | null; demo: boolean }) {
  const router = useRouter();
  const today = useToday();
  const locale = useLocale();
  const plan = useMemo(() => resolveCall(caseFile, stepParam, today, locale), [caseFile, stepParam, today, locale]);

  // The header's "Call" link carries no step. Put the chosen step in the URL, so the call that follows
  // stays on that step even after its own result changes which step is next.
  const chosenStepId = stepParam === null && plan.ok ? plan.step.id : null;
  useEffect(() => {
    if (chosenStepId) router.replace(callHref(chosenStepId));
  }, [chosenStepId, router]);

  if (!plan.ok) {
    return (
      <EmptyState title={plan.title} href={plan.next.href} action={plan.next.label}>
        {plan.message}
      </EmptyState>
    );
  }
  if (chosenStepId) return <PageSkeleton />;

  // A fresh visit starts a fresh call; coming back with the browser's Back button finds the call as it was left.
  // The language is part of the key: switching it before a call starts a fresh briefing in that language.
  return <CallSession key={`${router.bfcacheId}:${plan.step.id}:${locale}`} card={plan.card} brief={plan.brief} demo={demo} />;
}
