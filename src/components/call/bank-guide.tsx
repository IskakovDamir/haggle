"use client";

import Image from "next/image";
import { Check, ChevronDown } from "lucide-react";
import { Stagger, StaggerItem } from "@/components/motion/reveal";
import { Card } from "@/components/ui/primitives";
import type { Copy } from "@/lib/i18n/locale";
import { useLocale } from "@/lib/i18n/use-locale";
import type { NegotiationBrief } from "@/lib/types";
import { cn } from "@/lib/utils";
import { panel } from "./panel-theme";

type GuideCopy = {
  playTitle: string;
  suggestions: string[];
  /** The folded list of facts: its title, with how many there are. */
  sayTitle: (count: number) => string;
  sayLead: string;
  /** Said under the facts, which are stored in English. `spokenInSpanish`: the brief has the agent speak Spanish. */
  factsNote: (spokenInSpanish: boolean) => string | null;
  noFacts: string;
  saysFirst: string;
  ifNo: string;
};

const COPY: Copy<GuideCopy> = {
  en: {
    playTitle: "Make it work for it",
    suggestions: ["Say no first", "Offer something smaller", "Ask if it’s a person"],
    sayTitle: (count) => `What the agent knows · ${count}`,
    sayLead: "It states only these facts. Nothing else.",
    factsNote: () => null,
    noFacts: "The statement gave the agent no facts to state, so it will only ask.",
    saysFirst: "It says this first",
    ifNo: "If the bank says no",
  },
  es: {
    playTitle: "Que se lo gane",
    suggestions: ["Di que no primero", "Ofrece algo menor", "Pregunta si es una persona"],
    sayTitle: (count) => `Lo que sabe el agente · ${count}`,
    sayLead: "Solo afirma estos datos. Nada más.",
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
            <h2 className={cn(heading, "relative pr-16 text-white")}>{copy.playTitle}</h2>
            <Stagger as="ol" onMount gap={0.14} delay={0.4} className="relative mt-4 flex flex-col gap-3 pr-12">
              {copy.suggestions.map((suggestion, index) => (
                <StaggerItem as="li" key={suggestion} className="flex items-center gap-3 text-[15px] font-semibold text-white">
                  <span className="tabular flex size-7 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-hg-blue">
                    {index + 1}
                  </span>
                  {suggestion}
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </StaggerItem>

        <StaggerItem>
          <Card className="rounded-[32px] p-0 shadow-none">
            <details className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-6 [&::-webkit-details-marker]:hidden">
                <h2 className={cn(heading, "text-[17px]")}>{copy.sayTitle(brief.facts.length)}</h2>
                <ChevronDown
                  className="size-5 shrink-0 text-hg-muted transition-transform duration-300 group-open:rotate-180"
                  aria-hidden
                />
              </summary>
              <div className="px-6 pb-6">
                <p className="text-sm text-muted">{copy.sayLead}</p>
                {brief.facts.length > 0 ? (
                  <>
                    <Stagger as="ul" onMount gap={0.08} delay={0.7} className="mt-4 flex flex-col gap-2.5">
                      {brief.facts.map((fact) => (
                        <StaggerItem as="li" key={fact} className="flex gap-2.5 text-sm leading-snug">
                          <span
                            aria-hidden
                            className="mt-px flex size-[18px] shrink-0 items-center justify-center rounded-full bg-hg-blue-soft text-hg-blue"
                          >
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
              </div>
            </details>
          </Card>
        </StaggerItem>
      </Stagger>
    </aside>
  );
}
