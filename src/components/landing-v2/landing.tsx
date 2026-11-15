// The whole landing page in one language. "/" renders it in English and "/es" in Spanish.
import Link from "next/link";
import type { Locale } from "@/lib/i18n/locale";
import { Bank } from "./bank";
import { Closing } from "./closing";
import { Demo } from "./demo";
import { Faq } from "./faq";
import { Hero } from "./hero";
import { HowItWorks } from "./how-it-works";
import { Insight } from "./insight";
import { Pricing } from "./pricing";
import { Problem } from "./problem";
import { Stats } from "./stats";
import { Versus } from "./versus";
import { Wins } from "./wins";

const JUDGES: Record<Locale, { lead: string; cta: string }> = {
  en: { lead: "Judging Zimran Business Cup?", cta: "Take the 3-minute guided tour" },
  es: { lead: "¿Eres jurado de Zimran Business Cup?", cta: "Haz el recorrido guiado de 3 minutos" },
};

export function Landing({ locale = "en" }: { locale?: Locale }) {
  const judges = JUDGES[locale];
  return (
    <main className="flex-1 bg-white font-manrope">
      <Link
        href="/judges"
        className="group flex w-full flex-wrap items-center justify-center gap-x-2 gap-y-0.5 bg-hg-ink px-4 py-2.5 text-center text-[14px] leading-5 font-semibold text-white"
      >
        <span className="text-white/70">{judges.lead}</span>
        <span className="inline-flex items-center gap-1.5 underline decoration-white/30 underline-offset-4 transition-colors group-hover:decoration-white">
          {judges.cta}
          <span aria-hidden className="transition-transform duration-200 group-hover:translate-x-0.5">
            →
          </span>
        </span>
      </Link>
      <Hero locale={locale} />
      <Stats locale={locale} />
      <Insight locale={locale} />
      <Problem locale={locale} />
      <Bank locale={locale} />
      <Wins locale={locale} />
      <HowItWorks locale={locale} />
      <Demo locale={locale} />
      <Pricing locale={locale} />
      <Versus locale={locale} />
      <Faq locale={locale} />
      <Closing locale={locale} />
    </main>
  );
}
