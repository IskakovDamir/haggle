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
    lead: "Banks often forgive one slip if you ask. Tell us what happened and Haggle makes the call.",
  },
  es: {
    eyebrow: "Pago atrasado",
    title: (
      <>
        Recupera el cargo por <em>pago tardío</em>
      </>
    ),
    lead: "Los bancos suelen perdonar un descuido si se lo pides. Cuéntanos qué pasó y Haggle hace la llamada.",
  },
};

/** The /missed page's title block. A client component, so it follows the visitor's language. */
export function MissedHeader() {
  const copy = COPY[useLocale()];
  return (
    <Reveal as="header" y={16} className="mb-8 max-w-2xl">
      <h1 className="mt-3 text-[clamp(32px,5vw,48px)] leading-[1.1] font-semibold text-hg-ink">{copy.title}</h1>
      <p className="mt-3 text-lg text-hg-muted">{copy.lead}</p>
    </Reveal>
  );
}
