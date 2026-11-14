"use client";

import { Reveal } from "@/components/motion/reveal";
import type { Copy } from "@/lib/i18n/locale";
import { useLocale } from "@/lib/i18n/use-locale";

const COPY: Copy<{ eyebrow: string; title: React.ReactNode; lead: string }> = {
  en: {
    eyebrow: "Missed a payment",
    title: (
      <>
        Get the late fee <em>back</em>
      </>
    ),
    lead: "Banks often forgive one slip as a courtesy, if you ask. Tell us what happened and Haggle makes the call: the fee, your old rate and your credit report.",
  },
  es: {
    eyebrow: "Pago atrasado",
    title: (
      <>
        Recupera el cargo por <em>pago tardío</em>
      </>
    ),
    lead: "Los bancos suelen perdonar un descuido como cortesía, si se lo pides. Cuéntanos qué pasó y Haggle hace la llamada: el cargo, tu tasa anterior y tu reporte de crédito.",
  },
};

/** The /missed page's title block. A client component, so it follows the visitor's language. */
export function MissedHeader() {
  const copy = COPY[useLocale()];
  return (
    <Reveal as="header" y={16} className="mb-8 max-w-2xl">
      <span className="inline-flex rounded-full bg-hg-blue-soft px-3 py-1 text-xs font-semibold text-hg-blue">{copy.eyebrow}</span>
      <h1 className="mt-3 text-[clamp(32px,5vw,48px)] leading-[1.1] font-semibold text-hg-ink">{copy.title}</h1>
      <p className="mt-3 text-lg text-hg-muted">{copy.lead}</p>
    </Reveal>
  );
}
