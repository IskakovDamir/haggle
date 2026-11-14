// The calculator page, in English (/tools/credit-card-interest-calculator) or Spanish (/es/herramientas/calculadora-de-intereses).
import Link from "next/link";
import { Calculator } from "@/components/calculator/calculator";
import { FaqList, JsonLd } from "@/components/insights/blocks";
import { Breadcrumbs, CtaBand, SectionTitle, sectionPad } from "@/components/insights/chrome";
import { HgSection } from "@/components/landing-v2/ui";
import { calculatorPath, insightsTopicPath } from "@/lib/benchmarks/locale";
import { faqJsonLd } from "@/lib/benchmarks/seo";
import { siteUrl } from "@/lib/benchmarks/site";
import { calculatorFaq } from "@/lib/calculator/faq";
import { phoneIndexPath } from "@/lib/directory/locale";
import { breadcrumbJsonLd } from "@/lib/directory/seo";
import type { Copy, Locale } from "@/lib/i18n/locale";
import { cn } from "@/lib/utils";

type PageCopy = {
  home: string;
  homePath: string;
  crumb: string;
  appName: string;
  h1: [string, string];
  lead: string;
  questions: string;
  ready: [string, string, string, string, string];
  ctaTitle: string;
  ctaLead: string;
  ctaRate: string;
  ctaMissed: string;
};

const COPY: Copy<PageCopy> = {
  en: {
    home: "Home",
    homePath: "/",
    crumb: "Interest calculator",
    appName: "Credit card interest calculator",
    h1: ["Credit card interest calculator", "and what a lower rate saves"],
    lead: "Type your balance and APR. You will see what the card costs you this month and this year, how long the minimum payment takes to clear it, and how much a rate cut would save.",
    questions: "Questions about card interest",
    ready: ["Ready to ask? See ", "how each bank handles rate cuts", " and ", "the number to call", "."],
    ctaTitle: "Rather not make the call yourself?",
    ctaLead: "Haggle calls your card issuer, waits on hold, and asks for a lower rate. You pay only if the bank says yes.",
    ctaRate: "Have Haggle ask for a lower rate",
    ctaMissed: "Have Haggle call about a missed payment",
  },
  es: {
    home: "Inicio",
    homePath: "/es",
    crumb: "Calculadora de intereses",
    appName: "Calculadora de intereses de tarjetas de crédito",
    h1: ["Calculadora de intereses de tu tarjeta", "y cuánto ahorras con una tasa más baja"],
    lead: "Escribe tu saldo y tu APR. Verás cuánto te cuesta la tarjeta este mes y este año, cuánto tardas en pagarla con el mínimo y cuánto te ahorraría una reducción de la tasa.",
    questions: "Preguntas sobre los intereses de la tarjeta",
    ready: ["¿Listo para pedirlo? Mira ", "cómo maneja cada banco las reducciones de tasa", " y ", "el número al que debes llamar", "."],
    ctaTitle: "¿Prefieres no hacer la llamada tú?",
    ctaLead: "Haggle llama al emisor de tu tarjeta, espera en línea y pide una tasa más baja. Pagas solo si el banco dice que sí.",
    ctaRate: "Que Haggle pida una tasa más baja",
    ctaMissed: "Que Haggle llame por un pago atrasado",
  },
};

const link = "font-semibold text-hg-ink-2 underline decoration-hg-ink-2/30 underline-offset-[3px] hover:text-hg-blue";

export function CalculatorPageBody({ lang, description }: { lang: Locale; description: string }) {
  const t = COPY[lang];
  const path = calculatorPath(lang);
  const faq = calculatorFaq(lang);
  return (
    <>
      <JsonLd data={faqJsonLd(faq, lang)} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: t.appName,
          url: `${siteUrl()}${path}`,
          inLanguage: lang === "es" ? "es-US" : "en-US",
          applicationCategory: "FinanceApplication",
          operatingSystem: "Any",
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
          description,
        }}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: t.home, path: t.homePath },
          { name: t.crumb, path },
        ])}
      />

      <HgSection className={cn("flex flex-col gap-5 pt-10 pb-8 lg:pt-14", sectionPad)}>
        <Breadcrumbs items={[{ href: t.homePath, label: t.home }, { label: t.crumb }]} />
        <h1 className="max-w-[20ch] text-[clamp(34px,5vw,56px)] leading-[1.08] font-semibold tracking-[-0.04em] text-hg-ink">
          {t.h1[0]} <em>{t.h1[1]}</em>
        </h1>
        <p className="max-w-[60ch] text-[18px] leading-7 font-medium tracking-[-0.01em] text-hg-muted">{t.lead}</p>
      </HgSection>

      <HgSection className={cn("pb-10", sectionPad)}>
        <Calculator lang={lang} />
      </HgSection>

      <HgSection className={cn("flex flex-col gap-6 py-10", sectionPad)}>
        <SectionTitle title={t.questions} />
        <FaqList items={faq} lang={lang} />
        <p className="text-[15px] leading-6 font-medium text-hg-muted">
          {t.ready[0]}
          <Link href={insightsTopicPath("lower-apr", lang)} className={link}>
            {t.ready[1]}
          </Link>
          {t.ready[2]}
          <Link href={phoneIndexPath(lang)} className={link}>
            {t.ready[3]}
          </Link>
          {t.ready[4]}
        </p>
      </HgSection>

      <CtaBand
        title={t.ctaTitle}
        lead={t.ctaLead}
        lang={lang}
        actions={[
          { href: "/start", label: t.ctaRate },
          { href: "/missed", label: t.ctaMissed },
        ]}
      />
    </>
  );
}
