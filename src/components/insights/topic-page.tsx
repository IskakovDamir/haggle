// The two topic pages (missed payment, lower APR), in English or Spanish: one problem, five banks compared,
// sorted by the most useful number.
import Link from "next/link";
import { banksBy, DATASET_AS_OF, getMarketStat, getTopic } from "@/lib/benchmarks";
import { lowerAprFaqFor, missedPaymentFaqFor } from "@/lib/benchmarks/faq-es";
import { calculatorPath, insightsIndexPath, localizeBank, localizeStat, localizeTopic, localizedTimeline } from "@/lib/benchmarks/locale";
import { faqJsonLd } from "@/lib/benchmarks/seo";
import type { BankMetric, TopicSlug } from "@/lib/benchmarks/types";
import type { Copy, Locale } from "@/lib/i18n/locale";
import { cn } from "@/lib/utils";
import { HgSection } from "@/components/landing-v2/ui";
import { ProductButton } from "./product-button";
import { BankTable, FaqList, JsonLd, METRIC_LABELS, Timeline } from "./blocks";
import { CtaBand, PageIntro, SectionTitle, sectionPad } from "./chrome";
import { StatFigure } from "./provenance";

const SETUP: Record<TopicSlug, { art: string; marketStatIds: string[]; metrics: BankMetric[] }> = {
  "missed-payment": {
    art: "/landing/wins/3d-bell.png",
    marketStatIds: ["market-late-fee-waived", "market-late-fee-cap-first", "market-late-fee-cap-repeat", "market-annual-fee-waived"],
    metrics: ["lateFeeRefundRate", "lateFeeMax", "waitToPerson", "satisfaction"],
  },
  "lower-apr": {
    art: "/landing/wins/3d-arrow-down.png",
    marketStatIds: ["market-apr-ask-success", "market-apr-cut", "market-average-apr", "market-card-balances"],
    metrics: ["typicalAprCut", "waitToPerson", "satisfaction", "lateFeeRefundRate"],
  },
};

type TopicCopy = {
  home: string;
  homePath: string;
  insights: string;
  crumb: Record<TopicSlug, string>;
  h1: Record<TopicSlug, [string, string]>;
  lead: Record<TopicSlug, string>;
  sortedBy: (metric: string) => string;
  sortedLead: (bank: string) => string;
  timelineTitle: string;
  timelineLead: string;
  calcTitle: [string, string];
  calcOpen: string;
  questions: string;
  ctaTitle: string;
  ctaLead: string;
  ctaMissed: string;
  ctaRate: string;
};

const COPY: Copy<TopicCopy> = {
  en: {
    home: "Home",
    homePath: "/",
    insights: "Insights",
    crumb: { "missed-payment": "Missed payment", "lower-apr": "Lower APR" },
    h1: { "missed-payment": ["Missed a credit card payment?", "Here is how to get the fee back"], "lower-apr": ["How to get a lower credit card APR,", "bank by bank"] },
    lead: {
      "missed-payment": "A late fee is often the easiest thing to get back. Most people who ask get it waived. Here is what happens after a missed payment, and how five big banks compare.",
      "lower-apr": "Most cardholders who ask for a lower rate get one. Banks keep retention teams for exactly this call. Here is how often it works, and how five big banks compare.",
    },
    sortedBy: (metric) => `Sorted by ${metric.toLowerCase()}`,
    sortedLead: (bank) => `${bank} comes first on this measure. The highlighted column is the one the table is sorted by, and each column header says where its numbers come from.`,
    timelineTitle: "What happens after a missed payment",
    timelineLead: "The same federal rules apply at every big card issuer.",
    calcTitle: ["What would a cut save you?", "Try the interest calculator."],
    calcOpen: "Open the calculator",
    questions: "Questions people ask",
    ctaTitle: "Haggle makes the call for you",
    ctaLead: "It says it is an AI assistant, waits on hold, and asks for exactly what you want. You pay only if the bank says yes.",
    ctaMissed: "Have Haggle call about a missed payment",
    ctaRate: "Have Haggle ask for a lower rate",
  },
  es: {
    home: "Inicio",
    homePath: "/es",
    insights: "Datos",
    crumb: { "missed-payment": "Pago atrasado", "lower-apr": "Bajar la tasa" },
    h1: {
      "missed-payment": ["¿Te atrasaste en un pago de tu tarjeta?", "Así puedes recuperar el cargo"],
      "lower-apr": ["Cómo conseguir un APR más bajo en tu tarjeta,", "banco por banco"],
    },
    lead: {
      "missed-payment":
        "El cargo por pago atrasado suele ser lo más fácil de recuperar. La mayoría de quienes lo piden lo consiguen. Esto pasa después de un pago atrasado, y así se comparan cinco bancos grandes.",
      "lower-apr":
        "La mayoría de los titulares que piden una tasa más baja la consiguen. Los bancos tienen equipos de retención justo para esta llamada. Así de seguido funciona, y así se comparan cinco bancos grandes.",
    },
    sortedBy: (metric) => `Ordenado por ${metric.toLowerCase()}`,
    sortedLead: (bank) => `${bank} queda primero en esta medida. La columna resaltada es la que ordena la tabla, y cada encabezado indica de dónde salen sus números.`,
    timelineTitle: "Qué pasa después de un pago atrasado",
    timelineLead: "Las mismas reglas federales aplican a todos los emisores grandes de tarjetas.",
    calcTitle: ["¿Cuánto te ahorraría una reducción?", "Prueba la calculadora de intereses."],
    calcOpen: "Abrir la calculadora",
    questions: "Preguntas frecuentes",
    ctaTitle: "Haggle hace la llamada por ti",
    ctaLead: "Dice que es un asistente de IA, espera en línea y pide exactamente lo que quieres. Pagas solo si el banco dice que sí.",
    ctaMissed: "Que Haggle llame por un pago atrasado",
    ctaRate: "Que Haggle pida una tasa más baja",
  },
};

export function TopicBody({ slug, lang }: { slug: TopicSlug; lang: Locale }) {
  const t = COPY[lang];
  const topic = localizeTopic(getTopic(slug)!, lang);
  const setup = SETUP[slug];
  const names = METRIC_LABELS[lang];
  const banks = banksBy(topic.sortBy).map((b) => localizeBank(b, lang));
  const [top] = banks;
  const faq = slug === "missed-payment" ? missedPaymentFaqFor(lang) : lowerAprFaqFor(lang);

  return (
    <>
      <JsonLd data={faqJsonLd(faq, lang)} />
      <PageIntro
        crumbs={[{ href: t.homePath, label: t.home }, { href: insightsIndexPath(lang), label: t.insights }, { label: t.crumb[slug] }]}
        title={
          <>
            {t.h1[slug][0]} <em>{t.h1[slug][1]}</em>
          </>
        }
        lead={t.lead[slug]}
        asOf={DATASET_AS_OF}
        art={{ src: setup.art, rotate: -8 }}
        lang={lang}
      />

      <HgSection className={cn("py-6", sectionPad)}>
        <div className="grid grid-cols-1 gap-8 rounded-[28px] border border-hg-line p-7 sm:grid-cols-2 sm:p-8 lg:grid-cols-4">
          {setup.marketStatIds.map((id) => (
            <StatFigure key={id} stat={localizeStat(getMarketStat(id), lang)} lang={lang} />
          ))}
        </div>
      </HgSection>

      <HgSection className={cn("flex flex-col gap-6 py-10", sectionPad)}>
        <SectionTitle title={t.sortedBy(names[topic.sortBy])} lead={t.sortedLead(top.name)} />
        <BankTable banks={banks} metrics={setup.metrics} highlight={topic.sortBy} label={t.sortedBy(names[topic.sortBy])} lang={lang} />
        <ProductButton path={topic.ctaPath} className="self-start" lang={lang}>
          {topic.ctaLabel}
        </ProductButton>
      </HgSection>

      {slug === "missed-payment" ? (
        <HgSection className={cn("flex flex-col gap-8 py-12", sectionPad)}>
          <SectionTitle title={t.timelineTitle} lead={t.timelineLead} />
          <Timeline steps={localizedTimeline(lang)} lang={lang} />
        </HgSection>
      ) : (
        <HgSection className={cn("py-6", sectionPad)}>
          <Link
            href={calculatorPath(lang)}
            className="flex flex-col gap-2 rounded-[28px] bg-hg-ink p-7 transition-transform duration-300 hover:-translate-y-0.5 sm:flex-row sm:items-center sm:justify-between"
          >
            <span className="text-[22px] leading-7 font-semibold tracking-[-0.03em] text-white">
              {t.calcTitle[0]} <span className="text-white/55">{t.calcTitle[1]}</span>
            </span>
            <span className="text-[13px] leading-[18px] font-semibold tracking-[0.04em] whitespace-nowrap text-white uppercase">{t.calcOpen}</span>
          </Link>
        </HgSection>
      )}

      <HgSection className={cn("flex flex-col gap-6 py-12", sectionPad)}>
        <SectionTitle title={t.questions} />
        <FaqList items={faq} lang={lang} />
      </HgSection>

      <CtaBand
        title={t.ctaTitle}
        lead={t.ctaLead}
        lang={lang}
        actions={[
          { href: "/missed", label: t.ctaMissed },
          { href: "/start", label: t.ctaRate },
        ]}
      />
    </>
  );
}
