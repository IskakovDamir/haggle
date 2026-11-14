"use client";

import Link from "next/link";
import { CalendarClock } from "lucide-react";
import { formatDate } from "@/lib/format";
import type { Copy } from "@/lib/i18n/locale";
import { useLocale } from "@/lib/i18n/use-locale";
import { Stagger, StaggerItem } from "@/components/motion/reveal";
import { buttonVariants } from "@/components/ui/button";
import { Badge, Card } from "@/components/ui/primitives";
import type { CallRecord, IsoDate } from "@/lib/types";
import { cn } from "@/lib/utils";
import { callHref } from "@/components/call/resolve-call";
import { ASK_AGAIN_AFTER_MONTHS, askAgainDate, stepIdOf } from "@/components/dashboard/progress";
import type { OutcomeKind } from "./outcome-kind";

type Story = { title: React.ReactNode; body: string };

type NoWinCopy = {
  story: (kind: Exclude<OutcomeKind, "win">, bankName: string) => Story;
  /** The bank asked for the cardholder and the agent handed the call over before any answer. */
  handedOff: (bankName: string) => Story;
  handedOffNext: string;
  badge: string;
  next: string;
  askAgain: (bankName: string, months: number) => string;
  callToday: string;
  noted: (note: string) => string;
  onDashboard: string;
  callAgain: string;
  backToPlan: string;
  dashboard: string;
};

const COPY: Copy<NoWinCopy> = {
  en: {
    story: (kind, bankName) => {
      switch (kind) {
        case "declined":
          return {
            title: (
              <>
                {bankName} said <em>no</em> this time
              </>
            ),
            body: "Nothing changed on the card, and you pay nothing. Haggle charges only after a win.",
          };
        case "unconfirmed":
          return {
            title: (
              <>
                We could not <em>confirm</em> this result
              </>
            ),
            body: "The agent heard an offer, but its numbers are not in the bank's own words on the call. Haggle does not count it and does not charge for it.",
          };
        case "unclear":
          return {
            title: (
              <>
                The call ended <em>without an answer</em>
              </>
            ),
            body: "The bank did not say yes or no, so nothing changed and you pay nothing.",
          };
      }
    },
    handedOff: (bankName) => ({
      title: (
        <>
          Handed to the <em>cardholder</em>
        </>
      ),
      body: `${bankName} asked to speak with the cardholder, so the agent connected them and left the call. What was agreed after that is not in the transcript, so Haggle counts nothing and charges nothing.`,
    }),
    handedOffNext: "Call again to get the agreement on record. If the bank already said yes to the cardholder, the agent can confirm the terms.",
    badge: "No win, no fee · practice call",
    next: "What happens next",
    askAgain: (bankName, months) =>
      `Ask ${bankName} again in about ${months} months. Banks often say yes once more on-time payments are on file.`,
    callToday: "You can call again today. A clear yes or no from the bank, with the numbers said out loud, gives a result.",
    noted: (note) => `Noted on the call: ${note}`,
    onDashboard: "The date is on your dashboard, with a calendar file to download.",
    callAgain: "Call again",
    backToPlan: "Back to your plan",
    dashboard: "See your dashboard",
  },
  es: {
    story: (kind, bankName) => {
      switch (kind) {
        case "declined":
          return {
            title: (
              <>
                {bankName} dijo que <em>no</em> esta vez
              </>
            ),
            body: "No cambió nada en la tarjeta y no pagas nada. Haggle cobra solo después de una victoria.",
          };
        case "unconfirmed":
          return {
            title: (
              <>
                No pudimos <em>confirmar</em> este resultado
              </>
            ),
            body: "El agente escuchó una oferta, pero sus números no están en las propias palabras del banco en la llamada. Haggle no la cuenta y no cobra por ella.",
          };
        case "unclear":
          return {
            title: (
              <>
                La llamada terminó <em>sin respuesta</em>
              </>
            ),
            body: "El banco no dijo ni sí ni no, así que nada cambió y no pagas nada.",
          };
      }
    },
    handedOff: (bankName) => ({
      title: (
        <>
          Pasada al <em>titular</em>
        </>
      ),
      body: `${bankName} pidió hablar con el titular, así que el agente lo conectó y salió de la llamada. Lo que se acordó después no está en la transcripción, así que Haggle no cuenta nada y no cobra nada.`,
    }),
    handedOffNext: "Vuelve a llamar para dejar el acuerdo registrado. Si el banco ya le dijo que sí al titular, el agente puede confirmar los términos.",
    badge: "Sin victoria, sin cargo · llamada de práctica",
    next: "Lo que sigue",
    askAgain: (bankName, months) =>
      `Vuelve a pedírselo a ${bankName} en unos ${months} meses. Los bancos suelen decir que sí cuando ya hay más pagos a tiempo en tu historial.`,
    callToday: "Puedes volver a llamar hoy. Un sí o un no claro del banco, con los números dichos en voz alta, da un resultado.",
    noted: (note) => `Anotado en la llamada: ${note}`,
    onDashboard: "La fecha está en tu panel, con un archivo de calendario para descargar.",
    callAgain: "Llamar otra vez",
    backToPlan: "Volver a tu plan",
    dashboard: "Ver tu panel",
  },
};

/** After a call with no confirmed win: what happened, and what happens next and on which date. */
export function NoWin({
  kind,
  call,
  bankName,
  today,
}: {
  kind: Exclude<OutcomeKind, "win">;
  call: CallRecord;
  bankName: string;
  today: IsoDate;
}) {
  const copy = COPY[useLocale()];
  const handedOff = kind === "unclear" && call.handedOff === true;
  const story = handedOff ? copy.handedOff(bankName) : copy.story(kind, bankName);
  const declined = kind === "declined";
  const noted = call.outcome?.followUp ?? null;

  // Calm on purpose: no burst, no red, only the gentle rise used across the app.
  return (
    <Card className="relative overflow-hidden rounded-[32px] p-6 sm:p-10">
      <div aria-hidden className="pointer-events-none absolute -top-40 -right-32 size-[28rem] rounded-full bg-hg-blue-soft blur-3xl" />
      <Stagger onMount gap={0.1} className="relative">
        <StaggerItem>
          <Badge tone="outline" className="bg-white px-3 py-1">
            {copy.badge}
          </Badge>
        </StaggerItem>
        <StaggerItem
          as="h1"
          className="mt-4 text-[clamp(32px,5vw,52px)] leading-[1.08] font-semibold tracking-[-0.035em] text-hg-ink"
        >
          {story.title}
        </StaggerItem>
        <StaggerItem as="p" className="mt-3 max-w-[60ch] text-[17px] leading-7 font-medium text-muted sm:text-lg">
          {story.body}
        </StaggerItem>

        <StaggerItem className="mt-7 flex gap-4 rounded-[24px] bg-hg-surface p-5 sm:p-6">
          <span aria-hidden className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white text-hg-blue shadow-[0_6px_16px_-10px_rgb(11_18_32/0.35)]">
            <CalendarClock className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold tracking-widest text-muted uppercase">{copy.next}</p>
            <p className="tabular mt-1 text-2xl font-semibold tracking-[-0.02em] text-hg-ink">
              {declined ? formatDate(askAgainDate(call)) : formatDate(today)}
            </p>
            <p className="mt-1 max-w-[60ch] text-hg-ink-2">
              {declined ? copy.askAgain(bankName, ASK_AGAIN_AFTER_MONTHS) : handedOff ? copy.handedOffNext : copy.callToday}
            </p>
            {noted && <p className="mt-2 max-w-[60ch] text-sm text-muted">{copy.noted(noted)}</p>}
            {declined && <p className="mt-2 text-sm text-muted">{copy.onDashboard}</p>}
          </div>
        </StaggerItem>

        <StaggerItem className="mt-7 flex flex-col gap-2 sm:flex-row">
          {!declined && (
            <Link href={callHref(stepIdOf(call))} className={buttonVariants({ size: "lg" })}>
              {copy.callAgain}
            </Link>
          )}
          <Link href="/plan" className={cn(buttonVariants({ size: "lg", variant: declined ? "default" : "outline" }))}>
            {copy.backToPlan}
          </Link>
          <Link href="/dashboard" className={buttonVariants({ size: "lg", variant: "ghost" })}>
            {copy.dashboard}
          </Link>
        </StaggerItem>
      </Stagger>
    </Card>
  );
}
