// "How to ask [bank] for a lower APR": a step-by-step guide per bank, in English or Spanish.
// It is the deep page for the lower-rate intent; the bank's insights page covers missed payments.
import Link from "next/link";
import { BlobPanel } from "@/components/landing-v2/pricing-panel";
import { HgSection } from "@/components/landing-v2/ui";
import { DATASET_AS_OF, getMarketStat } from "@/lib/benchmarks";
import { guideNumbers } from "@/lib/benchmarks/apr-guide";
import type { FaqItem, Segment } from "@/lib/benchmarks/faq";
import { calculatorPath, insightsBankPath, insightsIndexPath, insightsTopicPath, localizeBank, localizeStat, localizedTimeline } from "@/lib/benchmarks/locale";
import { faqJsonLd } from "@/lib/benchmarks/seo";
import type { Bank } from "@/lib/benchmarks/types";
import { ISSUERS, mainLine } from "@/lib/directory";
import { localizeIssuer, phonePath } from "@/lib/directory/locale";
import { formatApr, formatPoints } from "@/lib/format";
import type { Copy, Locale } from "@/lib/i18n/locale";
import { formatDollars } from "@/lib/money";
import { cn } from "@/lib/utils";
import { FaqList, JsonLd } from "./blocks";
import { CtaBand, PageIntro, SectionTitle, sectionPad } from "./chrome";
import { ProductButton } from "./product-button";
import { Provenance, SourceLink, StatFigure } from "./provenance";

type Step = { title: string; body: string[] };

type GuideCopy = {
  home: string;
  homePath: string;
  insights: string;
  crumb: string;
  h1: (name: string) => [string, string];
  lead: (name: string) => string;
  keyNumbers: (name: string) => string;
  worth: (points: string) => string;
  worthLead: (name: string) => string;
  colBalance: string;
  colNow: (apr: string) => string;
  colAfter: (apr: string) => string;
  colSaved: string;
  calculated: string;
  tryYours: string;
  steps: string;
  stepsLead: string;
  stepList: (name: string) => Step[];
  callLine: (name: string) => [string, string];
  seeNumbers: (name: string) => string;
  winTitle: string;
  win: (points: string) => string;
  penaltyTitle: string;
  penaltyLead: (name: string) => string;
  penaltyLink: (name: string) => string;
  questions: (name: string) => string;
  faq: (name: string, line: string | null) => { q: [string, string, string, string, string]; a: AnswerParts };
  ctaTitle: (name: string) => string;
  ctaLead: string;
  ctaRate: (name: string) => string;
  more: [string, string, string, string, string];
};

type AnswerParts = {
  will: [string, string, string, string];
  howMuch: [string, string, string];
  credit: string;
  call: (line: string | null) => string;
};

const COPY: Copy<GuideCopy> = {
  en: {
    home: "Home",
    homePath: "/",
    insights: "Insights",
    crumb: "Lower APR",
    h1: (name) => [`How to ask ${name} for a lower APR,`, "step by step"],
    lead: (name) =>
      `Most cardholders who ask for a lower rate get one. Here is what a cut is worth, what to say to ${name}, what to do if the answer is no, and what to check before you accept.`,
    keyNumbers: (name) => `Asking ${name} for a lower rate, in four numbers`,
    worth: (points) => `What a ${points}-point cut is worth`,
    worthLead: (name) => `Interest over a year at the US average APR, before and after the cut we estimate ${name} gives when it says yes.`,
    colBalance: "Balance",
    colNow: (apr) => `Interest a year at ${apr}`,
    colAfter: (apr) => `After the cut, at ${apr}`,
    colSaved: "Saved in a year",
    calculated: "Calculated by Haggle's tested engine: balance times APR, with the balance held for a year.",
    tryYours: "Try your own balance and APR in the calculator",
    steps: "How to make the call",
    stepsLead: "Short and honest works. Do not give a reason that is not true.",
    stepList: (name) => [
      {
        title: "Before the call",
        body: [
          "Find your current APR and balance on your latest statement.",
          "Note whether you have paid on time this past year. If you have, say so. If you have not, do not claim it.",
          "If you really are thinking about moving the balance to another card, you can say that. Do not mention an offer you do not have.",
        ],
      },
      {
        title: "On the call",
        body: [
          `Say: "I'm calling about the interest rate on my ${name} card ending in [last 4 digits]. My APR is [current APR]. I'd like to keep using the card, and I'm asking whether you can lower my rate."`,
          "Then stop and let them answer.",
        ],
      },
      {
        title: "If they say no",
        body: [
          "Ask once whether a supervisor or the retention team can look at it.",
          "If the answer is still no, thank them and ask when you could ask again. You can try again after a few more months of on-time payments.",
        ],
      },
      {
        title: "Before you accept",
        body: [
          "Ask whether the new rate needs a hard credit check.",
          "Ask for the new APR, the date it starts, and whether it is permanent or for a set number of months. Read the terms back.",
        ],
      },
      {
        title: "After the call",
        body: ["Check that your next statement shows the new APR. If it does not, call back with the date and the name of the person you spoke to."],
      },
    ],
    callLine: (name) => [`${name}'s card line is `, ", from "],
    seeNumbers: (name) => `See every ${name} number`,
    winTitle: "What Haggle counts as a win",
    win: (points) => `Haggle's agent treats any cut of ${points} points or more as a win and reads the new terms back to the bank. You pay only if the bank says yes.`,
    penaltyTitle: "If your rate went up after a late payment",
    penaltyLead: (name) => `That is a penalty rate, and the rules for it are federal. They apply at ${name} too.`,
    penaltyLink: (name) => `Late fees and penalty rates at ${name}`,
    questions: (name) => `Questions about lowering your ${name} APR`,
    faq: (name) => ({
      q: [
        `Will ${name} lower my APR if I ask?`,
        `How much lower can ${name} go?`,
        "Will asking for a lower rate hurt my credit?",
        `What number do I call at ${name}?`,
        `Can ${name} raise my rate after a late payment?`,
      ],
      a: {
        will: ["Often. Across issuers, ", " of cardholders who asked for a lower rate got one. When ", " says yes, we estimate a cut of about ", "."],
        howMuch: ["The average cut for people who asked was ", ". Our estimate for this bank is ", "."],
        credit:
          "A rate request is usually a phone call, not a new application, so it does not normally need a hard credit check. Ask before you accept, and Haggle asks the bank for you.",
        call: (line) => (line ? `${name}'s official site lists ${line} for card customer service.` : `Use the number on the back of your ${name} card.`),
      },
    }),
    ctaTitle: (name) => `Let Haggle ask ${name} for you`,
    ctaLead: "It says it is an AI assistant, waits on hold, makes the ask above, and reads the new terms back. You pay only if the bank says yes.",
    ctaRate: (name) => `Have Haggle ask ${name} for a lower rate`,
    more: ["More: ", "how every bank compares on rate cuts", ", ", "late fees at this bank", "."],
  },
  es: {
    home: "Inicio",
    homePath: "/es",
    insights: "Datos",
    crumb: "Bajar la tasa",
    h1: (name) => [`Cómo pedirle a ${name} un APR más bajo,`, "paso a paso"],
    lead: (name) =>
      `La mayoría de los titulares que piden una tasa más baja la consiguen. Aquí ves cuánto vale una reducción, qué decirle a ${name}, qué hacer si te dicen que no y qué revisar antes de aceptar.`,
    keyNumbers: (name) => `Pedirle a ${name} una tasa más baja, en cuatro números`,
    worth: (points) => `Cuánto vale una reducción de ${points} puntos`,
    worthLead: (name) => `Intereses de un año con el APR promedio de EE. UU., antes y después de la reducción que estimamos que da ${name} cuando dice que sí.`,
    colBalance: "Saldo",
    colNow: (apr) => `Intereses en un año al ${apr}`,
    colAfter: (apr) => `Con la reducción, al ${apr}`,
    colSaved: "Ahorro en un año",
    calculated: "Calculado con el motor probado de Haggle: saldo por APR, con el saldo igual durante un año.",
    tryYours: "Prueba tu propio saldo y tu APR en la calculadora",
    steps: "Cómo hacer la llamada",
    stepsLead: "Corto y honesto funciona. No des un motivo que no sea cierto.",
    stepList: (name) => [
      {
        title: "Antes de llamar",
        body: [
          "Busca tu APR actual y tu saldo en tu último estado de cuenta.",
          "Fíjate si pagaste a tiempo durante el último año. Si es así, dilo. Si no, no lo digas.",
          "Si de verdad estás pensando en pasar el saldo a otra tarjeta, puedes decirlo. No menciones una oferta que no tienes.",
        ],
      },
      {
        title: "En la llamada",
        body: [
          `Di: "Llamo por la tasa de interés de mi tarjeta ${name} que termina en [últimos 4 dígitos]. Mi APR es [APR actual]. Quiero seguir usando la tarjeta y pregunto si pueden bajarme la tasa."`,
          "Después espera la respuesta.",
        ],
      },
      {
        title: "Si te dicen que no",
        body: [
          "Pregunta una vez si un supervisor o el equipo de retención puede revisarlo.",
          "Si sigue siendo no, da las gracias y pregunta cuándo podrías volver a pedirlo. Puedes intentarlo de nuevo después de algunos meses más de pagos a tiempo.",
        ],
      },
      {
        title: "Antes de aceptar",
        body: [
          "Pregunta si la nueva tasa requiere una consulta de crédito completa (hard pull).",
          "Pide el nuevo APR, la fecha en que empieza y si es permanente o por un número de meses. Repite las condiciones.",
        ],
      },
      {
        title: "Después de la llamada",
        body: ["Revisa que tu siguiente estado de cuenta muestre el nuevo APR. Si no, vuelve a llamar con la fecha y el nombre de la persona que te atendió."],
      },
    ],
    callLine: (name) => [`La línea de tarjetas de ${name} es el `, ", según "],
    seeNumbers: (name) => `Ver todos los teléfonos de ${name}`,
    winTitle: "Qué cuenta Haggle como un éxito",
    win: (points) =>
      `El agente de Haggle considera un éxito cualquier reducción de ${points} puntos o más y le repite al banco las nuevas condiciones. Pagas solo si el banco dice que sí.`,
    penaltyTitle: "Si tu tasa subió después de un pago atrasado",
    penaltyLead: (name) => `Eso es una tasa de penalización, y sus reglas son federales. También aplican en ${name}.`,
    penaltyLink: (name) => `Cargos por atraso y tasas de penalización en ${name}`,
    questions: (name) => `Preguntas sobre bajar el APR de tu tarjeta ${name}`,
    faq: (name) => ({
      q: [
        `¿${name} me baja el APR si lo pido?`,
        `¿Cuánto puede bajar ${name}?`,
        "¿Pedir una tasa más baja afecta mi crédito?",
        `¿A qué número llamo en ${name}?`,
        `¿${name} puede subirme la tasa después de un pago atrasado?`,
      ],
      a: {
        will: ["Muchas veces. Entre todos los emisores, el ", " de los titulares que pidieron una tasa más baja la consiguieron. Cuando ", " dice que sí, estimamos una reducción de unos ", "."],
        howMuch: ["La reducción promedio de quienes lo pidieron fue de ", ". Nuestra estimación para este banco es de ", "."],
        credit:
          "Pedir una tasa más baja suele ser una llamada, no una solicitud nueva, así que normalmente no requiere una consulta de crédito completa. Pregunta antes de aceptar; Haggle se lo pregunta al banco por ti.",
        call: (line) => (line ? `El sitio oficial de ${name} indica el ${line} para servicio al cliente de tarjetas.` : `Usa el número del reverso de tu tarjeta ${name}.`),
      },
    }),
    ctaTitle: (name) => `Deja que Haggle se lo pida a ${name}`,
    ctaLead: "Dice que es un asistente de IA, espera en línea, hace el pedido de arriba y repite las nuevas condiciones. Pagas solo si el banco dice que sí.",
    ctaRate: (name) => `Que Haggle le pida a ${name} una tasa más baja`,
    more: ["Más: ", "cómo se comparan todos los bancos en reducciones de tasa", ", ", "cargos por atraso en este banco", "."],
  },
};

const link = "font-semibold text-hg-ink-2 underline decoration-hg-ink-2/30 underline-offset-[3px] hover:text-hg-blue";
const body = "text-[16px] leading-[26px] font-medium text-hg-ink-2";
const caption = "text-left text-[13px] leading-[18px] font-semibold tracking-[-0.002em] text-hg-muted";

/** The FAQ for one bank's guide, shared by the page and its JSON-LD. */
export function aprGuideFaq(raw: Bank, lang: Locale): FaqItem[] {
  const bank = localizeBank(raw, lang);
  const name = bank.shortName;
  const issuer = ISSUERS.find((i) => i.insights === raw.slug);
  const line = issuer ? mainLine(issuer).display : null;
  const t = COPY[lang].faq(name, line);
  const market = (id: string) => localizeStat(getMarketStat(id), lang);
  const penalty = localizedTimeline(lang).filter((s) => s.id === "timeline-penalty-rate" || s.id === "timeline-rate-restored");
  const callAnswer: Segment[] = issuer ? [t.a.call(line), { source: issuer.source }] : [t.a.call(null)];
  return [
    { question: t.q[0], answer: [t.a.will[0], { stat: market("market-apr-ask-success") }, t.a.will[1], name, t.a.will[2], { stat: bank.stats.typicalAprCut }, t.a.will[3]] },
    { question: t.q[1], answer: [t.a.howMuch[0], { stat: market("market-apr-cut") }, t.a.howMuch[1], { stat: bank.stats.typicalAprCut }, t.a.howMuch[2]] },
    { question: t.q[2], answer: [t.a.credit] },
    { question: t.q[3], answer: callAnswer },
    { question: t.q[4], answer: [penalty.map((s) => s.text).join(" "), { source: penalty[0].source }] },
  ];
}

export function AprGuideBody({ bank: raw, lang }: { bank: Bank; lang: Locale }) {
  const t = COPY[lang];
  const bank = localizeBank(raw, lang);
  const name = bank.shortName;
  const g = guideNumbers(raw);
  const market = (id: string) => localizeStat(getMarketStat(id), lang);
  const avgApr = market("market-average-apr");
  const rawIssuer = ISSUERS.find((i) => i.insights === raw.slug);
  const issuer = rawIssuer && localizeIssuer(rawIssuer, lang);
  const faq = aprGuideFaq(raw, lang);
  const penalty = localizedTimeline(lang).filter((s) => s.id === "timeline-penalty-rate" || s.id === "timeline-rate-restored");

  return (
    <>
      <JsonLd data={faqJsonLd(faq, lang)} />
      <PageIntro
        crumbs={[
          { href: t.homePath, label: t.home },
          { href: insightsIndexPath(lang), label: t.insights },
          { href: insightsBankPath(raw.slug, lang), label: bank.name },
          { label: t.crumb },
        ]}
        title={
          <>
            {t.h1(name)[0]} <em>{t.h1(name)[1]}</em>
          </>
        }
        lead={t.lead(name)}
        asOf={DATASET_AS_OF}
        art={{ src: "/landing/wins/3d-arrow-down.png", rotate: -8 }}
        lang={lang}
      />

      <HgSection className={cn("py-6", sectionPad)}>
        <div
          className="flex flex-col gap-8 rounded-[40px] p-6 md:p-12"
          style={{ backgroundImage: "linear-gradient(161.82deg, #2453e6 14.286%, #0f2a9e 85.714%)" }}
        >
          <h2 className="text-[clamp(24px,3.2vw,34px)] leading-[1.15] font-semibold tracking-[-0.035em] text-white">{t.keyNumbers(name)}</h2>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <StatFigure stat={market("market-apr-ask-success")} tone="dark" lang={lang} />
            <StatFigure stat={market("market-apr-cut")} tone="dark" lang={lang} />
            <StatFigure stat={bank.stats.typicalAprCut} tone="dark" lang={lang} />
            <StatFigure stat={avgApr} tone="dark" lang={lang} />
          </div>
        </div>
      </HgSection>

      <HgSection className={cn("flex flex-col gap-6 py-10", sectionPad)}>
        <SectionTitle title={t.worth(formatPoints(g.cutBps))} lead={t.worthLead(name)} />
        <BlobPanel dir="versus" angle={158.98} bottoms={{ center: -200, left: -130 }} className="p-2 sm:p-7">
          <div role="region" aria-label={t.worth(formatPoints(g.cutBps))} tabIndex={0} className="overflow-x-auto rounded-[28px] border border-white bg-white/94">
            <table className="w-full">
              <thead>
                <tr>
                  <th scope="col" className={cn("px-3 py-4 align-bottom sm:px-6", caption)}>
                    {t.colBalance}
                  </th>
                  <th scope="col" className={cn("px-2.5 py-4 align-bottom sm:px-5", caption)}>
                    {t.colNow(formatApr(g.aprBps))}
                    <span className="mt-1 block text-[12px] leading-4 font-medium">
                      <Provenance stat={avgApr} lang={lang} />
                    </span>
                  </th>
                  <th scope="col" className={cn("px-2.5 py-4 align-bottom sm:px-5", caption)}>
                    {t.colAfter(formatApr(g.afterAprBps))}
                    <span className="mt-1 block text-[12px] leading-4 font-medium">
                      <Provenance stat={bank.stats.typicalAprCut} lang={lang} />
                    </span>
                  </th>
                  <th scope="col" className={cn("bg-hg-blue-soft px-2.5 py-4 align-bottom text-hg-ink-2 sm:px-5", caption)}>
                    {t.colSaved}
                  </th>
                </tr>
              </thead>
              <tbody>
                {g.rows.map((row) => (
                  <tr key={row.balanceCents} className="border-t border-hg-line">
                    <th scope="row" className="px-3 py-4 text-left text-[15px] leading-6 font-semibold text-hg-ink tabular-nums sm:px-6 sm:text-[16px]">
                      {formatDollars(row.balanceCents)}
                    </th>
                    <td className="px-2.5 py-4 text-[15px] leading-6 font-medium text-hg-ink-2 tabular-nums sm:px-5 sm:text-[16px]">{formatDollars(row.nowCents)}</td>
                    <td className="px-2.5 py-4 text-[15px] leading-6 font-medium text-hg-ink-2 tabular-nums sm:px-5 sm:text-[16px]">{formatDollars(row.afterCents)}</td>
                    <td className="bg-hg-blue-soft px-2.5 py-4 text-[16px] leading-6 font-semibold text-hg-ink tabular-nums sm:px-5 sm:text-[17px]">{formatDollars(row.savedCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="border-t border-hg-line px-4 py-4 text-[13px] leading-[18px] font-medium text-hg-muted sm:px-6">{t.calculated}</p>
          </div>
        </BlobPanel>
        <Link href={calculatorPath(lang)} className={cn(link, "self-start text-[15px]")}>
          {t.tryYours}
        </Link>
      </HgSection>

      <HgSection className={cn("flex flex-col gap-6 py-10", sectionPad)}>
        <SectionTitle title={t.steps} lead={t.stepsLead} />
        {issuer && (
          <p className={body}>
            {t.callLine(name)[0]}
            <span className="font-semibold text-hg-ink tabular-nums">{mainLine(issuer).display}</span>
            {t.callLine(name)[1]}
            <SourceLink source={issuer.source} lang={lang} />.{" "}
            <Link href={phonePath(issuer, lang)} className={link}>
              {t.seeNumbers(name)}
            </Link>
            .
          </p>
        )}
        <ol className="relative flex flex-col gap-0 border-l-2 border-hg-blue-tint pl-6 sm:pl-8">
          {t.stepList(name).map((step) => (
            <li key={step.title} className="relative pb-8 last:pb-0">
              <span aria-hidden className="absolute top-1.5 -left-[33px] size-3 rounded-full bg-hg-blue ring-4 ring-white sm:-left-[41px]" />
              <p className="text-[17px] leading-6 font-semibold tracking-[-0.01em] text-hg-ink">{step.title}</p>
              <div className="mt-2 flex max-w-[68ch] flex-col gap-2">
                {step.body.map((text) => (
                  <p key={text} className={body}>
                    {text}
                  </p>
                ))}
              </div>
            </li>
          ))}
        </ol>
      </HgSection>

      <HgSection className={cn("grid grid-cols-1 gap-6 py-10 lg:grid-cols-2", sectionPad)}>
        <div className="flex flex-col gap-4 rounded-[28px] bg-hg-ink p-7">
          <p className="text-[17px] leading-6 font-semibold tracking-[-0.01em] text-white">{t.winTitle}</p>
          <p className="text-[16px] leading-[26px] font-medium text-white/80">{t.win(formatPoints(g.winCutBps))}</p>
          <ProductButton path={`/start?bank=${raw.slug}`} tone="white" lang={lang} className="self-start">
            {t.ctaRate(name)}
          </ProductButton>
        </div>
        <div className="flex flex-col gap-4 rounded-[28px] bg-hg-surface p-7">
          <p className="text-[17px] leading-6 font-semibold tracking-[-0.01em] text-hg-ink">{t.penaltyTitle}</p>
          <p className={body}>{t.penaltyLead(name)}</p>
          {penalty.map((s) => (
            <p key={s.id} className={body}>
              {s.text}{" "}
              <span className="text-[13px]">
                (<SourceLink source={s.source} lang={lang} />)
              </span>
            </p>
          ))}
          <Link href={insightsBankPath(raw.slug, lang)} className={cn(link, "text-[15px]")}>
            {t.penaltyLink(name)}
          </Link>
        </div>
      </HgSection>

      <HgSection className={cn("flex flex-col gap-6 py-10", sectionPad)}>
        <SectionTitle title={t.questions(name)} />
        <FaqList items={faq} lang={lang} />
        <p className="text-[15px] leading-6 font-medium text-hg-muted">
          {t.more[0]}
          <Link href={insightsTopicPath("lower-apr", lang)} className={link}>
            {t.more[1]}
          </Link>
          {t.more[2]}
          <Link href={insightsBankPath(raw.slug, lang)} className={link}>
            {t.more[3]}
          </Link>
          {t.more[4]}
        </p>
      </HgSection>

      <CtaBand title={t.ctaTitle(name)} lead={t.ctaLead} lang={lang} actions={[{ href: `/start?bank=${raw.slug}`, label: t.ctaRate(name) }]} />
    </>
  );
}

