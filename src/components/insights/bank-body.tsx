// An insights bank page, in English (/insights/[bank]) or Spanish (/es/datos/[bank]).
import Image from "next/image";
import Link from "next/link";
import { FaqList, JsonLd, Timeline } from "@/components/insights/blocks";
import { CtaBand, PageIntro, SectionTitle, sectionPad } from "@/components/insights/chrome";
import { ProductButton } from "@/components/insights/product-button";
import { InlineStat, SourceLink, StatFigure } from "@/components/insights/provenance";
import { HgSection } from "@/components/landing-v2/ui";
import { BANKS, DATASET_AS_OF, getMarketStat } from "@/lib/benchmarks";
import { bankFaqFor } from "@/lib/benchmarks/faq-es";
import { aprGuidePath, insightsBankPath, insightsIndexPath, insightsTopicPath, localizeBank, localizeStat, localizedTimeline } from "@/lib/benchmarks/locale";
import { faqJsonLd } from "@/lib/benchmarks/seo";
import type { Bank } from "@/lib/benchmarks/types";
import { ISSUERS, mainLine } from "@/lib/directory";
import { localizeIssuer, phonePath } from "@/lib/directory/locale";
import type { Copy, Locale } from "@/lib/i18n/locale";
import { cn } from "@/lib/utils";

type BankCopy = {
  home: string;
  homePath: string;
  insights: string;
  title: (name: string) => [string, string];
  lead: (name: string) => string;
  fourNumbers: (name: string) => string;
  figures: [string, string, string, string];
  missedTitle: string;
  missedLead: string;
  lateFeesAt: (name: string) => string;
  ctaMissed: (name: string) => string;
  rateTitle: string;
  rateLead: (name: string) => string;
  ctaRate: (name: string) => string;
  guide: (name: string) => string;
  calling: (name: string) => string;
  cardLine: (name: string) => [string, string];
  seeEvery: (name: string) => string;
  menuTitle: string;
  noMenu: (name: string) => string;
  neverStores: string;
  wait: string;
  disagree: string;
  onePuts: string;
  anotherPuts: string;
  weWill: string;
  ourEstimateIs: string;
  holdForYou: string;
  questions: (name: string) => string;
  letCall: (name: string) => string;
  letCallLead: string;
  compare: string;
  and: string;
  orRead: string;
  missedLink: string;
  andA: string;
  lowerLink: string;
};

const COPY: Copy<BankCopy> = {
  en: {
    home: "Home",
    homePath: "/",
    insights: "Insights",
    title: (name) => [`${name} credit cards`, "late fees and lower rates"],
    lead: (name) => `What happens after a missed ${name} payment, how to get the late fee back, and what to expect when you ask ${name} for a lower rate.`,
    fourNumbers: (name) => `${name} in four numbers`,
    figures: ["of late fee refund requests granted", "typical rate cut when the answer is yes", "to reach a person", "J.D. Power satisfaction score, out of 1,000"],
    missedTitle: "If you missed a payment",
    missedLead: "The rules below apply to every big card issuer, including this one.",
    lateFeesAt: (name) => `Late fees at ${name}`,
    ctaMissed: (name) => `Have Haggle call ${name} about a missed payment`,
    rateTitle: "If your rate is too high",
    rateLead: (name) => `Banks keep retention teams that can cut your rate before you leave. Here is how often asking works, and what to expect from ${name}.`,
    ctaRate: (name) => `Have Haggle ask ${name} for a lower rate`,
    guide: (name) => `Read the step-by-step guide to asking ${name} for a lower APR`,
    calling: (name) => `Calling ${name}`,
    cardLine: (name) => [`${name}'s card line is `, ", from "],
    seeEvery: (name) => `See every ${name} number and what to say`,
    menuTitle: "What the phone menu asks for",
    noMenu: (name) => `We have not found a public source we trust for the ${name} menu yet. Haggle will record it on its first calls.`,
    neverStores: "Haggle never stores your full card number. When the bank needs to verify you, Haggle brings you onto the call to do it yourself.",
    wait: "How long you wait",
    disagree: "Public reports do not agree. ",
    onePuts: "One puts it at ",
    anotherPuts: " Another puts it at ",
    weWill: "Nobody measures this properly, so we will. Until then our estimate is ",
    ourEstimateIs: "Our estimate is ",
    holdForYou: ". Haggle waits on hold for you and brings you in only when a person picks up.",
    questions: (name) => `Questions about ${name}`,
    letCall: (name) => `Let Haggle call ${name}`,
    letCallLead: "It says it is an AI assistant, waits on hold, and asks for exactly what you want. You pay only if the bank says yes.",
    compare: "Compare with ",
    and: " and ",
    orRead: ", or read the comparisons for a ",
    missedLink: "missed payment",
    andA: " and a ",
    lowerLink: "lower APR",
  },
  es: {
    home: "Inicio",
    homePath: "/es",
    insights: "Datos",
    title: (name) => [`Tarjetas de crédito ${name}:`, "cargos por atraso y tasas más bajas"],
    lead: (name) => `Qué pasa si te atrasas en un pago con ${name}, cómo recuperar el cargo por pago atrasado y qué esperar cuando le pides a ${name} una tasa más baja.`,
    fourNumbers: (name) => `${name} en cuatro números`,
    figures: [
      "de las solicitudes de devolución del cargo aprobadas",
      "reducción típica de la tasa cuando dicen que sí",
      "para hablar con una persona",
      "puntaje de satisfacción de J.D. Power, sobre 1,000",
    ],
    missedTitle: "Si te atrasaste en un pago",
    missedLead: "Estas reglas aplican a todos los emisores grandes de tarjetas, incluido este.",
    lateFeesAt: (name) => `Cargos por pago atrasado en ${name}`,
    ctaMissed: (name) => `Que Haggle llame a ${name} por un pago atrasado`,
    rateTitle: "Si tu tasa es demasiado alta",
    rateLead: (name) =>
      `Los bancos tienen equipos de retención que pueden bajarte la tasa antes de que te vayas. Así de seguido funciona pedirlo, y esto puedes esperar de ${name}.`,
    ctaRate: (name) => `Que Haggle le pida a ${name} una tasa más baja`,
    guide: (name) => `Lee la guía paso a paso para pedirle a ${name} un APR más bajo`,
    calling: (name) => `Llamar a ${name}`,
    cardLine: (name) => [`La línea de tarjetas de ${name} es el `, ", según "],
    seeEvery: (name) => `Ver todos los teléfonos de ${name} y qué decir`,
    menuTitle: "Qué pide el menú telefónico",
    noMenu: (name) => `Todavía no encontramos una fuente pública confiable sobre el menú de ${name}. Haggle lo registrará en sus primeras llamadas.`,
    neverStores: "Haggle nunca guarda el número completo de tu tarjeta. Cuando el banco necesita confirmar que eres tú, Haggle te conecta a la llamada para que lo hagas tú.",
    wait: "Cuánto tienes que esperar",
    disagree: "Los reportes públicos no coinciden. ",
    onePuts: "Uno dice ",
    anotherPuts: " Otro dice ",
    weWill: "Nadie lo mide bien, así que lo haremos nosotros. Mientras tanto, nuestra estimación es de ",
    ourEstimateIs: "Nuestra estimación es de ",
    holdForYou: ". Haggle espera en línea por ti y solo te conecta cuando contesta una persona.",
    questions: (name) => `Preguntas sobre ${name}`,
    letCall: (name) => `Deja que Haggle llame a ${name}`,
    letCallLead: "Dice que es un asistente de IA, espera en línea y pide exactamente lo que quieres. Pagas solo si el banco dice que sí.",
    compare: "Compara con ",
    and: " y ",
    orRead: ", o lee las comparaciones para un ",
    missedLink: "pago atrasado",
    andA: " y un ",
    lowerLink: "APR más bajo",
  },
};

const link = "font-semibold text-hg-ink-2 underline decoration-hg-ink-2/30 underline-offset-[3px] hover:text-hg-blue";

/** The deep blue headline band from the landing's "Your bank would rather say yes" block. */
function Headline({ bank, lang }: { bank: Bank; lang: Locale }) {
  const t = COPY[lang];
  const { satisfaction, waitToPerson, lateFeeRefundRate, typicalAprCut } = bank.stats;
  return (
    <HgSection className={cn("py-6", sectionPad)}>
      <div
        className="relative isolate overflow-hidden rounded-[40px] p-6 md:p-12 xl:pr-[380px]"
        style={{ backgroundImage: "linear-gradient(161.82deg, #2453e6 14.286%, #0f2a9e 85.714%)" }}
      >
        <h2 className="text-[clamp(26px,3.4vw,36px)] leading-[1.15] font-semibold tracking-[-0.035em] text-white">{t.fourNumbers(bank.name)}</h2>
        <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-2">
          <StatFigure stat={lateFeeRefundRate} tone="dark" label={t.figures[0]} lang={lang} />
          <StatFigure stat={typicalAprCut} tone="dark" label={t.figures[1]} lang={lang} />
          <StatFigure stat={waitToPerson} tone="dark" label={t.figures[2]} lang={lang} />
          <StatFigure stat={satisfaction} tone="dark" label={t.figures[3]} lang={lang} />
        </div>
        <div aria-hidden className="pointer-events-none absolute top-1/2 right-[-90px] hidden size-[440px] -translate-y-1/2 xl:block">
          <div className="hg-float relative size-full rotate-6">
            <Image src="/landing/bank/bank-3d.png" alt="" fill sizes="440px" className="object-contain" />
          </div>
        </div>
      </div>
    </HgSection>
  );
}

export function BankBody({ bank: raw, lang }: { bank: Bank; lang: Locale }) {
  const t = COPY[lang];
  const bank = localizeBank(raw, lang);
  const market = (id: string) => localizeStat(getMarketStat(id), lang);
  const name = bank.shortName;
  const rawIssuer = ISSUERS.find((i) => i.insights === bank.slug);
  const issuer = rawIssuer && localizeIssuer(rawIssuer, lang);
  const faq = bankFaqFor(raw, lang);
  const others = BANKS.filter((b) => b.slug !== bank.slug);
  const missedHref = `/missed?bank=${bank.slug}`;
  const startHref = `/start?bank=${bank.slug}`;

  return (
    <>
      <JsonLd data={faqJsonLd(faq, lang)} />
      <PageIntro
        crumbs={[{ href: t.homePath, label: t.home }, { href: insightsIndexPath(lang), label: t.insights }, { label: bank.name }]}
        title={
          <>
            {t.title(bank.name)[0]} <em>{t.title(bank.name)[1]}</em>
          </>
        }
        lead={t.lead(name)}
        asOf={DATASET_AS_OF}
        lang={lang}
      />

      <Headline bank={bank} lang={lang} />

      <HgSection className={cn("grid grid-cols-1 gap-10 py-12 lg:grid-cols-[1fr_380px] lg:gap-16", sectionPad)}>
        <div className="flex flex-col gap-8">
          <SectionTitle id="missed-payment" title={t.missedTitle} lead={t.missedLead} />
          <Timeline steps={localizedTimeline(lang)} lang={lang} />
        </div>
        <aside className="flex flex-col gap-6 self-start rounded-[28px] bg-hg-surface p-7">
          <p className="text-[17px] leading-6 font-semibold tracking-[-0.01em] text-hg-ink">{t.lateFeesAt(name)}</p>
          <StatFigure stat={bank.stats.lateFeeMax} size="m" lang={lang} />
          <StatFigure stat={bank.stats.lateFeeRefundRate} size="m" lang={lang} />
          <StatFigure stat={market("market-late-fee-waived")} size="m" lang={lang} />
          {bank.facts.map((fact) => (
            <p key={fact.id} className="text-[15px] leading-6 font-medium text-hg-ink-2">
              {fact.text}{" "}
              <span className="text-[13px]">
                (<SourceLink source={fact.source} lang={lang} />
                {fact.note ? `. ${fact.note}` : ""})
              </span>
            </p>
          ))}
          <ProductButton path={missedHref} lang={lang}>
            {t.ctaMissed(name)}
          </ProductButton>
        </aside>
      </HgSection>

      <HgSection className={cn("flex flex-col gap-8 py-12", sectionPad)}>
        <SectionTitle id="lower-rate" title={t.rateTitle} lead={t.rateLead(name)} />
        <div className="grid grid-cols-1 gap-8 rounded-[28px] border border-hg-line p-7 sm:grid-cols-2 sm:p-8 lg:grid-cols-4">
          <StatFigure stat={market("market-apr-ask-success")} lang={lang} />
          <StatFigure stat={market("market-apr-cut")} lang={lang} />
          <StatFigure stat={bank.stats.typicalAprCut} lang={lang} />
          <StatFigure stat={market("market-average-apr")} lang={lang} />
        </div>
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <ProductButton path={startHref} tone="dark" lang={lang}>
            {t.ctaRate(name)}
          </ProductButton>
          <Link href={aprGuidePath(bank.slug, lang)} className={cn(link, "text-[15px]")}>
            {t.guide(name)}
          </Link>
        </div>
      </HgSection>

      <HgSection className={cn("flex flex-col gap-6 py-12", sectionPad)}>
        <SectionTitle id="phone" title={t.calling(name)} />
        {issuer && (
          <p className="text-[16px] leading-[26px] font-medium text-hg-ink-2">
            {t.cardLine(name)[0]}
            <span className="font-semibold text-hg-ink tabular-nums">{mainLine(issuer).display}</span>
            {t.cardLine(name)[1]}
            <SourceLink source={issuer.source} lang={lang} />.{" "}
            <Link href={phonePath(issuer, lang)} className={link}>
              {t.seeEvery(name)}
            </Link>
            .
          </p>
        )}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="flex flex-col gap-4 rounded-[28px] bg-hg-surface p-7">
            <p className="text-[17px] leading-6 font-semibold tracking-[-0.01em] text-hg-ink">{t.menuTitle}</p>
            {bank.phoneMenu.length > 0 ? (
              bank.phoneMenu.map((fact) => (
                <p key={fact.id} className="text-[16px] leading-[26px] font-medium text-hg-ink-2">
                  {fact.text}{" "}
                  <span className="text-[13px]">
                    (<SourceLink source={fact.source} lang={lang} />)
                  </span>
                </p>
              ))
            ) : (
              <p className="text-[16px] leading-[26px] font-medium text-hg-ink-2">{t.noMenu(name)}</p>
            )}
            <p className="text-[16px] leading-[26px] font-medium text-hg-ink-2">{t.neverStores}</p>
          </div>
          <div className="flex flex-col gap-4 rounded-[28px] bg-hg-ink p-7">
            <p className="text-[17px] leading-6 font-semibold tracking-[-0.01em] text-white">{t.wait}</p>
            {bank.extraStats.length > 0 ? (
              <>
                <p className="text-[16px] leading-[26px] font-medium text-white/80">
                  {t.disagree}
                  {bank.extraStats.map((stat, i) => (
                    <span key={stat.id}>
                      {i === 0 ? t.onePuts : t.anotherPuts}
                      <InlineStat stat={stat} tone="dark" lang={lang} />, {stat.label}.
                    </span>
                  ))}
                </p>
                <p className="text-[16px] leading-[26px] font-medium text-white/80">
                  {t.weWill}
                  <InlineStat stat={bank.stats.waitToPerson} tone="dark" lang={lang} />.
                </p>
              </>
            ) : (
              <p className="text-[16px] leading-[26px] font-medium text-white/80">
                {t.ourEstimateIs}
                <InlineStat stat={bank.stats.waitToPerson} tone="dark" lang={lang} />
                {t.holdForYou}
              </p>
            )}
          </div>
        </div>
      </HgSection>

      <HgSection className={cn("flex flex-col gap-6 py-12", sectionPad)}>
        <SectionTitle id="faq" title={t.questions(name)} />
        <FaqList items={faq} lang={lang} />
      </HgSection>

      <CtaBand
        title={t.letCall(name)}
        lead={t.letCallLead}
        lang={lang}
        actions={[
          { href: missedHref, label: t.ctaMissed(name) },
          { href: startHref, label: t.ctaRate(name) },
        ]}
      />

      <HgSection className={cn("pb-10", sectionPad)}>
        <p className="text-[15px] leading-6 font-medium text-hg-muted">
          {t.compare}
          {others.map((other, i) => (
            <span key={other.slug}>
              {i > 0 && (i === others.length - 1 ? t.and : ", ")}
              <Link href={insightsBankPath(other.slug, lang)} className={link}>
                {other.name}
              </Link>
            </span>
          ))}
          {t.orRead}
          <Link href={insightsTopicPath("missed-payment", lang)} className={link}>
            {t.missedLink}
          </Link>
          {t.andA}
          <Link href={insightsTopicPath("lower-apr", lang)} className={link}>
            {t.lowerLink}
          </Link>
          .
        </p>
      </HgSection>
    </>
  );
}
