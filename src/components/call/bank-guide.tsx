"use client";

import Image from "next/image";
import { Check } from "lucide-react";
import { Stagger, StaggerItem } from "@/components/motion/reveal";
import { Card } from "@/components/ui/primitives";
import type { Copy } from "@/lib/i18n/locale";
import { useLocale } from "@/lib/i18n/use-locale";
import type { NegotiationBrief } from "@/lib/types";
import { cn } from "@/lib/utils";
import { panel } from "./panel-theme";

type GuideCopy = {
  playTitle: string;
  playLead: string;
  suggestions: { title: string; detail: string }[];
  sayTitle: string;
  sayLead: string;
  /** Said under the facts, which are stored in English. `spokenInSpanish`: the brief has the agent speak Spanish. */
  factsNote: (spokenInSpanish: boolean) => string | null;
  noFacts: string;
  saysFirst: string;
  ifNo: string;
};

const COPY: Copy<GuideCopy> = {
  en: {
    playTitle: "How to play the bank",
    playLead: "Answer the way a card services representative would. Make the agent work for it.",
    suggestions: [
      { title: "Say no first", detail: "See what the agent does with a refusal." },
      { title: "Offer something smaller", detail: "A smaller cut, or a one-time credit." },
      { title: "Ask who you are speaking with", detail: "It has to say that it is an AI assistant." },
    ],
    sayTitle: "What the agent may say",
    sayLead: "Only these facts, taken from the statement you confirmed. It states nothing else as fact.",
    factsNote: () => null,
    noFacts: "The statement gave the agent no facts to state, so it will only ask.",
    saysFirst: "It says this first",
    ifNo: "If the bank says no",
  },
  es: {
    playTitle: "Cómo hacer de banco",
    playLead: "Responde como lo haría alguien de servicio al cliente de tarjetas. Que el agente se lo gane.",
    suggestions: [
      { title: "Di que no primero", detail: "Mira qué hace el agente con un rechazo." },
      { title: "Ofrece algo menor", detail: "Una rebaja más pequeña o un crédito por única vez." },
      { title: "Pregunta con quién hablas", detail: "Tiene que decir que es un asistente de IA." },
    ],
    sayTitle: "Lo que el agente puede decir",
    sayLead: "Solo estos datos, tomados del estado de cuenta que confirmaste. No afirma nada más como un hecho.",
    factsNote: (spokenInSpanish) =>
      spokenInSpanish
        ? "Aquí aparecen en inglés, tal como se guardaron. El agente los dice en español."
        : "Aquí aparecen en inglés, tal como se guardaron.",
    noFacts: "El estado de cuenta no le dio datos al agente, así que solo va a pedir.",
    saysFirst: "Lo primero que dice",
    ifNo: "Si el banco dice que no",
  },
};

const heading = "text-[20px] leading-tight font-semibold tracking-[-0.03em] text-hg-ink";

/** Beside the call: how to play the bank, and the only things the agent is allowed to state as fact. */
export function BankGuide({ brief }: { brief: NegotiationBrief }) {
  const copy = COPY[useLocale()];
  const factsNote = copy.factsNote(brief.language === "es");
  return (
    <aside>
      <Stagger onMount gap={0.12} delay={0.15} className="flex flex-col gap-4">
        <StaggerItem>
          <div className="relative overflow-hidden rounded-[32px] bg-[linear-gradient(150deg,#2448f0_0%,#2f6bff_55%,#8db6ff_100%)] p-6 text-white">
            <Image
              src="/app/3d/microphone-3d.png"
              alt=""
              aria-hidden
              width={84}
              height={168}
              sizes="84px"
              className="pointer-events-none absolute -top-[22px] -right-1.5 h-[168px] w-[84px] max-w-none select-none"
            />
            <div className="relative pr-16">
              <h2 className={cn(heading, "text-white")}>{copy.playTitle}</h2>
              <p className={cn("mt-1.5 text-sm", panel.dimOnDark)}>{copy.playLead}</p>
            </div>
            <Stagger as="ol" onMount gap={0.14} delay={0.4} className="relative mt-5 flex flex-col gap-4">
              {copy.suggestions.map((suggestion, index) => (
                <StaggerItem as="li" key={suggestion.title} className="relative flex gap-3">
                  {index < copy.suggestions.length - 1 && (
                    <span aria-hidden className="absolute top-8 -bottom-3 left-[13px] w-px bg-white/8" />
                  )}
                  <span className="tabular relative flex size-7 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-hg-blue">
                    {index + 1}
                  </span>
                  <span className="pt-0.5 text-sm leading-snug">
                    <b className="block font-semibold text-white">{suggestion.title}</b>
                    <span className={panel.dimOnDark}>{suggestion.detail}</span>
                  </span>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </StaggerItem>

        <StaggerItem>
          <Card className="rounded-[32px] p-6 shadow-none">
            <h2 className={heading}>{copy.sayTitle}</h2>
            <p className="mt-1.5 text-sm text-muted">{copy.sayLead}</p>
            {brief.facts.length > 0 ? (
              <>
                <Stagger as="ul" onMount gap={0.08} delay={0.7} className="mt-4 flex flex-col gap-2.5">
                  {brief.facts.map((fact) => (
                    <StaggerItem as="li" key={fact} className="flex gap-2.5 text-sm leading-snug">
                      <span aria-hidden className="mt-px flex size-[18px] shrink-0 items-center justify-center rounded-full bg-hg-blue-soft text-hg-blue">
                        <Check className="size-3" strokeWidth={3} />
                      </span>
                      {fact}
                    </StaggerItem>
                  ))}
                </Stagger>
                {factsNote && <p className="mt-3 text-xs text-muted">{factsNote}</p>}
              </>
            ) : (
              <p className="mt-4 text-sm">{copy.noFacts}</p>
            )}

            <dl className="mt-5 flex flex-col gap-3 border-t border-line pt-4 text-sm leading-snug">
              <div className={cn("rounded-[20px] px-4 py-3", panel.ink)}>
                <dt className="font-semibold">{copy.saysFirst}</dt>
                <dd className={cn("mt-0.5", panel.dimOnDark)}>{brief.disclosures.join(" ")}</dd>
              </div>
              <div className="px-1">
                <dt className="font-semibold text-hg-ink">{copy.ifNo}</dt>
                <dd className="mt-0.5 text-muted">{brief.fallback}</dd>
              </div>
            </dl>
          </Card>
        </StaggerItem>
      </Stagger>
    </aside>
  );
}
