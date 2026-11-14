// The insights index, in English (/insights) or Spanish (/es/datos).
import Image from "next/image";
import Link from "next/link";
import { BankTable, JsonLd } from "@/components/insights/blocks";
import { CtaBand, PageIntro, SectionTitle, sectionPad } from "@/components/insights/chrome";
import { StatFigure } from "@/components/insights/provenance";
import { StatCards } from "@/components/insights/stat-cards";
import { HgSection } from "@/components/landing-v2/ui";
import { BANKS, DATASET_AS_OF, getMarketStat } from "@/lib/benchmarks";
import { insightsBankPath, insightsTopicPath, localizeBank, localizeStat } from "@/lib/benchmarks/locale";
import { datasetJsonLd } from "@/lib/benchmarks/seo";
import type { TopicSlug } from "@/lib/benchmarks/types";
import type { Copy, Locale } from "@/lib/i18n/locale";
import { cn } from "@/lib/utils";

const HEADLINE = ["market-apr-ask-success", "market-apr-cut", "market-late-fee-waived", "market-annual-fee-waived"];
const CONTEXT = ["market-card-balances", "market-average-apr", "market-late-fee-cap-first", "market-late-fee-cap-repeat", "market-satisfaction-average"];

type Card = { topic: TopicSlug; title: string; second: string; body: string };

type IndexCopy = {
  home: string;
  homePath: string;
  crumb: string;
  title: string;
  lead: string;
  asking: string;
  askingLead: string;
  fiveBanks: string;
  fiveBanksLead: string;
  tableLabel: string;
  readMore: string;
  and: string;
  start: string;
  cards: [Card, Card];
  readComparison: string;
  ctaTitle: string;
  ctaLead: string;
  ctaMissed: string;
  ctaRate: string;
};

const COPY: Copy<IndexCopy> = {
  en: {
    home: "Home",
    homePath: "/",
    crumb: "Insights",
    title: "Credit card numbers, with every source showing",
    lead: "Most people who ask their bank for a lower rate or a fee refund get one. Few ever ask. Here is what the public data says, bank by bank, and where our own estimates fill the gaps.",
    asking: "Asking works",
    askingLead: "From LendingTree's survey of US cardholders, published in September 2026.",
    fiveBanks: "Five banks, side by side",
    fiveBanksLead: "Satisfaction scores come from J.D. Power. Wait times, late fees and rate cuts are our estimates for now, and each column says so.",
    tableLabel: "Five banks compared on satisfaction, wait, late fees and rate cuts",
    readMore: "Read more about ",
    and: " and ",
    start: "Start from your problem",
    cards: [
      { topic: "missed-payment", title: "Missed a payment", second: "and want the fee back", body: "What happens day by day, and which banks refund the late fee most often." },
      { topic: "lower-apr", title: "Rate too high", second: "and want it lower", body: "How often asking works, and how big a cut each bank tends to give." },
    ],
    readComparison: "Read the comparison",
    ctaTitle: "Haggle makes the call for you",
    ctaLead: "It waits on hold, asks for the fee back or a lower rate, and you pay only if the bank says yes.",
    ctaMissed: "Have Haggle call about a missed payment",
    ctaRate: "Have Haggle ask for a lower rate",
  },
  es: {
    home: "Inicio",
    homePath: "/es",
    crumb: "Datos",
    title: "Datos de tarjetas de crédito, con cada fuente a la vista",
    lead: "La mayoría de quienes le piden a su banco una tasa más baja o que les devuelvan un cargo lo consiguen. Muy pocos lo piden. Esto dicen los datos públicos, banco por banco, y dónde nuestras estimaciones completan lo que falta.",
    asking: "Pedirlo funciona",
    askingLead: "De la encuesta de LendingTree a titulares de tarjetas en EE. UU., publicada en septiembre de 2026.",
    fiveBanks: "Cinco bancos, lado a lado",
    fiveBanksLead: "Los puntajes de satisfacción son de J.D. Power. Los tiempos de espera, los cargos y las reducciones de tasa son estimaciones nuestras por ahora, y cada columna lo indica.",
    tableLabel: "Cinco bancos comparados por satisfacción, espera, cargos por atraso y reducciones de tasa",
    readMore: "Lee más sobre ",
    and: " y ",
    start: "Empieza por tu problema",
    cards: [
      { topic: "missed-payment", title: "Te atrasaste en un pago", second: "y quieres que te devuelvan el cargo", body: "Qué pasa día a día, y qué bancos devuelven el cargo con más frecuencia." },
      { topic: "lower-apr", title: "Tu tasa es muy alta", second: "y quieres bajarla", body: "Qué tan seguido funciona pedirlo, y cuánto suele bajar cada banco." },
    ],
    readComparison: "Ver la comparación",
    ctaTitle: "Haggle hace la llamada por ti",
    ctaLead: "Espera en línea, pide que te devuelvan el cargo o te bajen la tasa, y pagas solo si el banco dice que sí.",
    ctaMissed: "Que Haggle llame por un pago atrasado",
    ctaRate: "Que Haggle pida una tasa más baja",
  },
};

const LOOKS: Record<TopicSlug, { bg: string; art: string }> = {
  "missed-payment": { bg: "linear-gradient(133.83deg, #1e2740 14.286%, #0b1220 85.714%)", art: "/landing/wins/3d-bell.png" },
  "lower-apr": { bg: "linear-gradient(161.82deg, #2453e6 14.286%, #0f2a9e 85.714%)", art: "/landing/wins/3d-arrow-down.png" },
};

export function InsightsIndexBody({ lang }: { lang: Locale }) {
  const t = COPY[lang];
  const stat = (id: string) => localizeStat(getMarketStat(id), lang);
  const banks = BANKS.map((b) => localizeBank(b, lang));
  return (
    <>
      <JsonLd data={datasetJsonLd()} />
      <PageIntro
        crumbs={[{ href: t.homePath, label: t.home }, { label: t.crumb }]}
        title={t.title}
        lead={t.lead}
        asOf={DATASET_AS_OF}
        art={{ src: "/landing/wins/3d-gauge.png", rotate: -6 }}
        lang={lang}
      />

      <HgSection className={cn("flex flex-col gap-6 py-6", sectionPad)}>
        <SectionTitle title={t.asking} lead={t.askingLead} />
        <StatCards stats={HEADLINE.map(stat)} lang={lang} />
        <ul className="grid grid-cols-1 gap-x-8 gap-y-8 rounded-[28px] border border-hg-line px-6 py-7 sm:grid-cols-2 sm:px-8 lg:grid-cols-5">
          {CONTEXT.map((id) => (
            <li key={id}>
              <StatFigure stat={stat(id)} size="m" lang={lang} />
            </li>
          ))}
        </ul>
      </HgSection>

      <HgSection className={cn("flex flex-col gap-6 py-10", sectionPad)}>
        <SectionTitle title={t.fiveBanks} lead={t.fiveBanksLead} />
        <BankTable banks={banks} metrics={["satisfaction", "waitToPerson", "lateFeeMax", "lateFeeRefundRate", "typicalAprCut"]} label={t.tableLabel} lang={lang} />
        <p className="text-[15px] leading-6 font-medium text-hg-muted">
          {t.readMore}
          {banks.map((bank, i) => (
            <span key={bank.slug}>
              {i > 0 && (i === banks.length - 1 ? t.and : ", ")}
              <Link href={insightsBankPath(bank.slug, lang)} className="font-semibold text-hg-ink-2 underline decoration-hg-ink-2/30 underline-offset-[3px] hover:text-hg-blue">
                {bank.name}
              </Link>
            </span>
          ))}
          .
        </p>
      </HgSection>

      <HgSection className={cn("flex flex-col gap-6 py-6", sectionPad)}>
        <SectionTitle title={t.start} />
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {t.cards.map((card) => (
            <li key={card.topic}>
              <Link
                href={insightsTopicPath(card.topic, lang)}
                className="group relative isolate flex min-h-[240px] flex-col gap-3 overflow-hidden rounded-[28px] p-7 transition-transform duration-300 hover:-translate-y-0.5 md:pr-[220px]"
                style={{ backgroundImage: LOOKS[card.topic].bg }}
              >
                <span className="text-[32px] leading-[38px] font-semibold tracking-[-0.03em] text-white">
                  {card.title}
                  <span className="block text-white/55">{card.second}</span>
                </span>
                <span className="max-w-[34ch] text-[15px] leading-6 font-medium text-white/75">{card.body}</span>
                <span className="mt-auto text-[13px] leading-[18px] font-semibold tracking-[0.04em] text-white uppercase">{t.readComparison}</span>
                <span aria-hidden className="pointer-events-none absolute -right-6 -bottom-10 -z-10 size-[230px] transition-transform duration-500 group-hover:scale-105">
                  <Image src={LOOKS[card.topic].art} alt="" fill sizes="230px" className="object-contain" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
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
