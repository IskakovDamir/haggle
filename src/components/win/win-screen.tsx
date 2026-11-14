"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { MotionConfig } from "framer-motion";
import { savingsFromOutcome } from "@/lib/engine";
import type { Copy } from "@/lib/i18n/locale";
import { useLocale } from "@/lib/i18n/use-locale";
import { useCaseFile } from "@/lib/store";
import { buttonVariants } from "@/components/ui/button";
import type { CallOutcome, CallRecord, CardAccount, CaseFile, Savings } from "@/lib/types";
import { goalLabel } from "@/components/call/ask";
import { useToday } from "@/components/call/clock";
import { EmptyState, Notice, PageSkeleton } from "@/components/call/page-states";
import { callHref, planFor } from "@/components/call/resolve-call";
import { firstOpenStep, stepIdOf } from "@/components/dashboard/progress";
import { changesFromOutcome } from "./changes";
import { NextUp } from "./next-up";
import { NoWin } from "./no-win";
import { outcomeKind } from "./outcome-kind";
import { PayPanel } from "./pay-panel";
import { Receipt } from "./receipt";
import { ResultCard } from "./result-card";
import { usePaymentReturn } from "./use-payment-return";
import { Appear, BEAT } from "./win-motion";

type WinCopy = {
  emptyTitle: string;
  emptyBody: string;
  addStatement: string;
  notFoundTitle: string;
  notFoundBody: string;
  seeCalls: string;
  noResultTitle: string;
  noResultBody: string;
  callAgain: string;
  theBank: string;
  planFailed: string;
  savingsFailed: string;
  paidVsSaved: string;
  backToPlan: string;
};

const COPY: Copy<WinCopy> = {
  en: {
    emptyTitle: "Nothing here yet",
    emptyBody: "A result shows up here after a call. Start with a card statement.",
    addStatement: "Add a statement",
    notFoundTitle: "Call not found",
    notFoundBody: "We could not find that call in this browser. Every call you made is on the dashboard.",
    seeCalls: "See your calls",
    noResultTitle: "No result yet",
    noResultBody: "This call ended before its result was read.",
    callAgain: "Call again",
    theBank: "The bank",
    planFailed: "We could not work out the rest of your plan just now. Please reload the page.",
    savingsFailed: "We could not work out the savings for this call. Nothing is charged for it.",
    paidVsSaved: "See paid versus saved",
    backToPlan: "Back to your plan",
  },
  es: {
    emptyTitle: "Todavía no hay nada aquí",
    emptyBody: "Aquí aparece el resultado después de una llamada. Empieza con un estado de cuenta.",
    addStatement: "Agregar un estado de cuenta",
    notFoundTitle: "No encontramos la llamada",
    notFoundBody: "No pudimos encontrar esa llamada en este navegador. Todas tus llamadas están en el panel.",
    seeCalls: "Ver tus llamadas",
    noResultTitle: "Todavía no hay resultado",
    noResultBody: "Esta llamada terminó antes de que se leyera su resultado.",
    callAgain: "Llamar otra vez",
    theBank: "El banco",
    planFailed: "No pudimos calcular el resto de tu plan en este momento. Vuelve a cargar la página.",
    savingsFailed: "No pudimos calcular el ahorro de esta llamada. No se cobra nada por ella.",
    paidVsSaved: "Ver lo pagado frente a lo ahorrado",
    backToPlan: "Volver a tu plan",
  },
};

/** "/win?call=<callId>": the result of one call. Also where Stripe sends the visitor back, with "session_id". */
export function WinScreen() {
  const params = useSearchParams();
  const callId = params.get("call");
  const sessionId = params.get("session_id");
  const { caseFile, ready } = useCaseFile();
  const copy = COPY[useLocale()];

  if (!ready) return <PageSkeleton />;
  if (!caseFile) {
    return (
      <EmptyState title={copy.emptyTitle} action={copy.addStatement}>
        {copy.emptyBody}
      </EmptyState>
    );
  }

  const call = caseFile.calls.find((candidate) => candidate.id === callId);
  const card = call && caseFile.cards.find((candidate) => candidate.id === call.cardId);
  if (!call || !card) {
    return (
      <EmptyState title={copy.notFoundTitle} href="/dashboard" action={copy.seeCalls}>
        {copy.notFoundBody}
      </EmptyState>
    );
  }
  if (!call.outcome) {
    return (
      <EmptyState title={copy.noResultTitle} href={callHref(stepIdOf(call))} action={copy.callAgain}>
        {copy.noResultBody}
      </EmptyState>
    );
  }
  return <CallResult caseFile={caseFile} call={call} card={card} outcome={call.outcome} sessionId={sessionId} />;
}

/** The savings stored with the call. An older call without them is worked out again; null when that fails. */
function savingsOf(call: CallRecord, card: CardAccount, outcome: CallOutcome): Savings | null {
  if (call.savings) return call.savings;
  try {
    return savingsFromOutcome(card, outcome);
  } catch {
    return null;
  }
}

function CallResult({
  caseFile,
  call,
  card,
  outcome,
  sessionId,
}: {
  caseFile: CaseFile;
  call: CallRecord;
  card: CardAccount;
  outcome: CallOutcome;
  sessionId: string | null;
}) {
  const today = useToday();
  const paymentReturn = usePaymentReturn(call, sessionId);
  const kind = outcomeKind(outcome);
  const locale = useLocale();
  const copy = COPY[locale];
  const bankName = card.issuerName.trim() || copy.theBank;

  const plan = planFor(caseFile.cards, today);
  const nextStep = plan && firstOpenStep(plan, caseFile.calls, { except: stepIdOf(call) });
  const planNotice = plan === null && <Notice>{copy.planFailed}</Notice>;

  if (kind !== "win") {
    return (
      <div className="flex flex-col gap-6">
        <NoWin kind={kind} call={call} bankName={bankName} today={today} />
        {planNotice}
        <NextUp step={nextStep} today={today} delay={0.45} />
      </div>
    );
  }

  const savings = savingsOf(call, card, outcome);
  return (
    <MotionConfig reducedMotion="user">
      <div className="flex flex-col gap-6">
        <ResultCard
          bankName={bankName}
          outcome={outcome}
          changes={changesFromOutcome(card, outcome, locale)}
          savings={savings ?? { annualSavingsCents: 0, lines: [], feeCents: 0 }}
        />

        {savings === null && (
          <Appear delay={BEAT.savings}>
            <Notice tone="alarm">{copy.savingsFailed}</Notice>
          </Appear>
        )}
        {savings !== null && savings.annualSavingsCents > 0 && (
          <div className="grid items-start gap-6 md:grid-cols-2">
            <Appear delay={BEAT.receipt}>
              <Receipt savings={savings} />
            </Appear>
            {/* The fee and the way to pay it arrive last, once the win and what it is worth have landed. */}
            <Appear delay={BEAT.pay}>
              <PayPanel
                call={call}
                savings={savings}
                label={`${goalLabel(call.goal, locale)}, ${bankName}`.slice(0, 80)}
                paymentReturn={paymentReturn}
              />
            </Appear>
          </div>
        )}

        {planNotice}
        <NextUp step={nextStep} today={today} primary={call.paid !== null} delay={BEAT.next} />

        <Appear delay={BEAT.links} y={8} className="flex flex-col gap-2 sm:flex-row">
          <Link href="/dashboard" className={buttonVariants({ variant: "outline", size: "lg" })}>
            {copy.paidVsSaved}
          </Link>
          <Link href="/plan" className={buttonVariants({ variant: "ghost", size: "lg" })}>
            {copy.backToPlan}
          </Link>
        </Appear>
      </div>
    </MotionConfig>
  );
}
