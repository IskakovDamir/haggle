// The body of an issuer's phone page, in English (/phone/[issuer]) or Spanish (/es/telefonos/[issuer]).
// Every sentence lives in COPY, so both languages have the same sections and a missing line fails the type check.
import Link from "next/link";
import { CheckedOn, LinesTable, PhoneNumber, Script } from "@/components/directory/blocks";
import { FaqList, JsonLd } from "@/components/insights/blocks";
import { Breadcrumbs, SectionTitle, sectionPad } from "@/components/insights/chrome";
import { ProductButton } from "@/components/insights/product-button";
import { InlineStat, SourceLink } from "@/components/insights/provenance";
import { HgSection } from "@/components/landing-v2/ui";
import { getBank, getMarketStat } from "@/lib/benchmarks";
import { faqJsonLd } from "@/lib/benchmarks/seo";
import { issuersAtoZ, mainLine } from "@/lib/directory";
import { issuerFaq } from "@/lib/directory/faq";
import { localizeIssuer, phoneIndexPath, phonePath, serviceNameFor } from "@/lib/directory/locale";
import { breadcrumbJsonLd } from "@/lib/directory/seo";
import type { Issuer } from "@/lib/directory/types";
import type { Copy, Locale } from "@/lib/i18n/locale";
import { cn } from "@/lib/utils";

type PageCopy = {
  home: string;
  homePath: string;
  phoneNumbers: string;
  heading: (issuer: Issuer) => [string, string];
  issuedBy: (who: string) => string;
  aliases: (list: string) => string;
  noHours: (site: string) => string;
  skip: string;
  callsFor: (callee: string) => string;
  pitch: (decider: string) => string;
  theBank: string;
  bankBehind: (name: string) => string;
  ctaMissed: (name: string, store: boolean) => string;
  ctaRate: (name: string, store: boolean) => string;
  allNumbers: (name: string) => string;
  allNumbersLead: (name: string) => string;
  reachPerson: string;
  noMenu: (name: string) => string;
  wait: string;
  reportsDisagree: string;
  onePuts: string;
  anotherPuts: string;
  ourEstimate: string;
  statLabel: (id: string, label: string) => string;
  noWaitData: (name: string) => string;
  before: string;
  before1: [string, string];
  before2: [string, string];
  before3: [string, string];
  say: string;
  sayLead: string;
  missedTitle: string;
  missedLines: (name: string) => string[];
  missedNote: string;
  rateTitle: string;
  rateLines: (name: string) => string[];
  rateNote: string;
  worth: [string, string, string];
  questions: (name: string) => string;
  moreOn: (name: string) => string;
  moreOnLink: (name: string) => string;
  read: [string, string, string, string, string, string];
  others: string;
  disclaimer: (name: string) => string;
};

const COPY: Copy<PageCopy> = {
  en: {
    home: "Home",
    homePath: "/",
    phoneNumbers: "Phone numbers",
    heading: (issuer) => [serviceNameFor(issuer, "en"), "phone number"],
    issuedBy: (who) => `Issued by ${who}. `,
    aliases: (list) => `Also searched as ${list}.`,
    noHours: (site) => `Hours are not listed on ${site}.`,
    skip: "Skip the hold.",
    callsFor: (callee) => `Haggle calls ${callee} for you.`,
    pitch: (decider) =>
      `It says it is an AI assistant, waits on hold, and asks for a late fee refund or a lower rate. You join only to verify it is you, and you pay only if ${decider} says yes.`,
    theBank: "the bank",
    bankBehind: (name) => `the bank behind your ${name} card`,
    ctaMissed: (name, store) => (store ? `Call about a missed ${name} card payment` : `Call ${name} about a missed payment`),
    ctaRate: (name, store) => (store ? `Ask for a lower rate on your ${name} card` : `Ask ${name} for a lower rate`),
    allNumbers: (name) => `All ${name} numbers`,
    allNumbersLead: (name) => `These are the numbers ${name} publishes on its own site. Use the one on the back of your card if it differs.`,
    reachPerson: "How to reach a person",
    noMenu: (name) =>
      `We have not recorded the ${name} phone menu yet. Haggle will publish it once its own calls do. If the menu does not offer a person, saying "representative" usually moves you along.`,
    wait: "How long you wait",
    reportsDisagree: "Public reports do not agree. ",
    onePuts: "One puts it at ",
    anotherPuts: " Another puts it at ",
    ourEstimate: "Our estimate until our own calls measure it: ",
    statLabel: (_id, label) => label,
    noWaitData: (name) => `Nobody publishes reliable hold times for ${name}, and we have not measured them yet. Haggle will publish its own numbers once it calls.`,
    before: "Before you call",
    before1: ["Your card and statement", "The card number, your balance, your APR and any late fee, all printed on your latest statement."],
    before2: [
      "A way to verify it is you",
      "Banks usually check details such as your billing ZIP code or date of birth. Never share a full card number or password with anyone who calls you.",
    ],
    before3: ["One clear ask", "A refund of a named fee, or a specific lower rate. Write down any terms the agent offers and read them back."],
    say: "What to say",
    sayLead: "Fill in the brackets with what is true for you. Do not add a reason you do not have: a short, honest ask works.",
    missedTitle: "If you missed a payment",
    missedLines: (name) => [
      `Hi, I'm calling about my ${name} card ending in [last 4 digits].`,
      "I missed the payment due on [date] and paid it on [date].",
      "I've been a customer for [years] and I'd like to ask for the late fee to be refunded as a courtesy.",
    ],
    missedNote: "If they say no, ask once whether a supervisor or the retention team can look at it.",
    rateTitle: "If your rate is too high",
    rateLines: (name) => [
      `Hi, I'm calling about the interest rate on my ${name} card ending in [last 4 digits].`,
      "My APR is [current APR]. I'd like to keep using this card, and I'm asking whether you can lower my rate.",
      "Does a lower rate need a hard credit check?",
    ],
    rateNote: "If they offer a cut, ask for the new APR and when it starts, and read it back before you hang up.",
    worth: ["Why it is worth asking: ", " of people who asked got a late fee waived, and ", " of those who asked for a lower rate got one."],
    questions: (name) => `Questions about calling ${name}`,
    moreOn: (name) => `More on ${name}: `,
    moreOnLink: (name) => `late fees, refunds and rate cuts at ${name}`,
    read: ["Read how to ", "get a late fee back", " and how to ", "ask for a lower APR", ", or ", "see what a lower rate would save you"],
    others: ". Other issuers: ",
    disclaimer: (name) => `Haggle is not affiliated with ${name}. The numbers above are ${name}'s own, read from its site on the date shown.`,
  },
  es: {
    home: "Inicio",
    homePath: "/es",
    phoneNumbers: "Teléfonos",
    heading: (issuer) => ["Teléfono de servicio al cliente", /\bcard\b/i.test(issuer.name) ? `de ${issuer.name}` : `de tarjetas de crédito ${issuer.name}`],
    issuedBy: (who) => `Emitida por ${who}. `,
    aliases: (list) => `También se busca como ${list}.`,
    noHours: (site) => `El horario no aparece en ${site}.`,
    skip: "Evita la espera.",
    callsFor: (callee) => `Haggle llama a ${callee} por ti.`,
    pitch: (decider) =>
      `Dice que es un asistente de IA, espera en línea y pide que te devuelvan el cargo por pago atrasado o que te bajen la tasa. Tú solo entras para confirmar que eres tú, y pagas solo si ${decider} dice que sí.`,
    theBank: "el banco",
    bankBehind: (name) => `el banco detrás de tu tarjeta ${name}`,
    ctaMissed: (name, store) => (store ? `Llamar por un pago atrasado de tu tarjeta ${name}` : `Llamar a ${name} por un pago atrasado`),
    ctaRate: (name, store) => (store ? `Pedir una tasa más baja en tu tarjeta ${name}` : `Pedirle a ${name} una tasa más baja`),
    allNumbers: (name) => `Todos los teléfonos de ${name}`,
    allNumbersLead: (name) => `Estos son los números que ${name} publica en su propio sitio. Si el del reverso de tu tarjeta es otro, usa ese.`,
    reachPerson: "Cómo hablar con una persona",
    noMenu: (name) =>
      `Todavía no hemos registrado el menú telefónico de ${name}. Haggle lo publicará cuando haga sus propias llamadas. Si el menú no ofrece hablar con una persona, decir "representante" suele ayudar.`,
    wait: "Cuánto tienes que esperar",
    reportsDisagree: "Los reportes públicos no coinciden. ",
    onePuts: "Uno dice ",
    anotherPuts: " Otro dice ",
    ourEstimate: "Nuestra estimación, hasta que nuestras llamadas lo midan: ",
    statLabel: (id, label) =>
      ({
        "chase-hold-gethuman": "el promedio en la línea internacional de tarjetas de Chase, de 783 llamadas en 90 días",
        "chase-hold-donotpay": "la espera habitual en la línea principal de Chase",
      })[id] ?? label,
    noWaitData: (name) => `Nadie publica tiempos de espera confiables para ${name}, y todavía no los hemos medido. Haggle publicará sus propios datos cuando llame.`,
    before: "Antes de llamar",
    before1: ["Tu tarjeta y tu estado de cuenta", "El número de la tarjeta, tu saldo, tu APR y cualquier cargo por pago atrasado. Todo aparece en tu último estado de cuenta."],
    before2: [
      "Una forma de confirmar que eres tú",
      "Los bancos suelen pedir datos como tu código postal de facturación o tu fecha de nacimiento. Nunca des el número completo de tu tarjeta ni tu contraseña a nadie que te llame.",
    ],
    before3: ["Un pedido claro", "Que te devuelvan un cargo concreto, o una tasa más baja concreta. Anota las condiciones que te ofrezcan y repítelas."],
    say: "Qué decir",
    sayLead: "Completa los corchetes con lo que sea cierto para ti. No inventes un motivo: un pedido corto y honesto funciona.",
    missedTitle: "Si te atrasaste en un pago",
    missedLines: (name) => [
      `Hola, llamo por mi tarjeta ${name} que termina en [últimos 4 dígitos].`,
      "No hice el pago que vencía el [fecha] y lo pagué el [fecha].",
      "Soy cliente desde hace [años] y quisiera pedir que me devuelvan el cargo por pago atrasado como cortesía.",
    ],
    missedNote: "Si te dicen que no, pregunta una vez si un supervisor o el equipo de retención puede revisarlo.",
    rateTitle: "Si tu tasa es demasiado alta",
    rateLines: (name) => [
      `Hola, llamo por la tasa de interés de mi tarjeta ${name} que termina en [últimos 4 dígitos].`,
      "Mi APR es [APR actual]. Quiero seguir usando esta tarjeta y pregunto si pueden bajarme la tasa.",
      "¿Una tasa más baja requiere una consulta de crédito completa (hard pull)?",
    ],
    rateNote: "Si te ofrecen una reducción, pregunta cuál es el nuevo APR y desde cuándo aplica, y repítelo antes de colgar.",
    worth: ["Por qué vale la pena pedirlo: al ", " de quienes lo pidieron les quitaron el cargo por pago atrasado, y el ", " de quienes pidieron una tasa más baja la consiguieron."],
    questions: (name) => `Preguntas sobre llamar a ${name}`,
    moreOn: (name) => `Más sobre ${name}: `,
    moreOnLink: (name) => `cargos, devoluciones y reducciones de tasa en ${name} (en inglés)`,
    read: ["Lee (en inglés) cómo ", "recuperar un cargo por pago atrasado", " y cómo ", "pedir un APR más bajo", ", o ", "mira cuánto te ahorraría una tasa más baja"],
    others: ". Otros emisores: ",
    disclaimer: (name) => `Haggle no tiene relación con ${name}. Los números de arriba son los de ${name}, tomados de su sitio en la fecha indicada.`,
  },
};

const body = "text-[16px] leading-[26px] font-medium text-hg-ink-2";
const link = "font-semibold text-hg-ink-2 underline decoration-hg-ink-2/30 underline-offset-[3px] hover:text-hg-blue";

export function IssuerPageBody({ issuer: raw, lang }: { issuer: Issuer; lang: Locale }) {
  const t = COPY[lang];
  const issuer = localizeIssuer(raw, lang);
  const name = issuer.name;
  const line = mainLine(issuer);
  const bank = issuer.insights ? getBank(issuer.insights) : undefined;
  const faq = issuerFaq(issuer, lang);
  const path = phonePath(issuer, lang);
  const others = issuersAtoZ().filter((i) => i.slug !== issuer.slug);
  // A store card account lives with a bank, so that is who Haggle calls.
  const store = issuer.group === "store";
  const callee = store ? t.bankBehind(name) : name;

  return (
    <>
      <JsonLd data={faqJsonLd(faq, lang)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: t.home, path: t.homePath },
          { name: t.phoneNumbers, path: phoneIndexPath(lang) },
          { name, path },
        ])}
      />

      <HgSection className={cn("flex flex-col gap-6 pt-10 pb-6 lg:pt-14", sectionPad)}>
        <Breadcrumbs items={[{ href: t.homePath, label: t.home }, { href: phoneIndexPath(lang), label: t.phoneNumbers }, { label: name }]} />
        <h1 className="max-w-[22ch] text-[clamp(34px,5vw,56px)] leading-[1.08] font-semibold tracking-[-0.04em] text-hg-ink">
          {t.heading(issuer)[0]} <em>{t.heading(issuer)[1]}</em>
        </h1>
        {(issuer.issuedBy || issuer.aliases.length > 0) && (
          <p className="text-[15px] leading-6 font-medium text-hg-muted">
            {issuer.issuedBy && t.issuedBy(issuer.issuedBy)}
            {issuer.aliases.length > 0 && t.aliases(issuer.aliases.join(", "))}
          </p>
        )}

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.4fr_1fr]">
          <div
            className="relative isolate flex flex-col gap-3 overflow-hidden rounded-[32px] p-7 md:p-10"
            style={{ backgroundImage: "linear-gradient(161.82deg, #2453e6 14.286%, #0f2a9e 85.714%)" }}
          >
            <p className="text-[15px] leading-5 font-semibold text-white/75">{line.label}</p>
            <PhoneNumber line={line} className="text-[clamp(30px,8.4vw,64px)] leading-none font-semibold tracking-[-0.03em] whitespace-nowrap text-white hover:text-white/85" />
            <p className="text-[16px] leading-6 font-medium text-white/85">{line.hours ?? t.noHours(issuer.source.name)}</p>
            <p className="mt-2 text-[13px] leading-[18px] font-medium">
              <CheckedOn issuer={issuer} tone="dark" lang={lang} />
            </p>
          </div>
          <div className="flex flex-col gap-4 rounded-[32px] bg-hg-ink p-7 md:p-10">
            <p className="text-[24px] leading-[30px] font-semibold tracking-[-0.03em] text-white">
              {t.skip} <span className="text-white/55">{t.callsFor(callee)}</span>
            </p>
            <p className="text-[15px] leading-6 font-medium text-white/75">{t.pitch(store ? t.theBank : name)}</p>
            <div className="mt-auto flex flex-col gap-2.5">
              <ProductButton path={`/missed?bank=${issuer.slug}`} tone="white" lang={lang}>
                {t.ctaMissed(name, store)}
              </ProductButton>
              <ProductButton path={`/start?bank=${issuer.slug}`} tone="blue" lang={lang}>
                {t.ctaRate(name, store)}
              </ProductButton>
            </div>
          </div>
        </div>
      </HgSection>

      <HgSection className={cn("flex flex-col gap-6 py-10", sectionPad)}>
        <SectionTitle title={t.allNumbers(name)} lead={t.allNumbersLead(name)} />
        <LinesTable issuer={issuer} lang={lang} />
      </HgSection>

      <HgSection className={cn("grid grid-cols-1 gap-6 py-10 lg:grid-cols-2", sectionPad)}>
        <div className="flex flex-col gap-4 rounded-[28px] bg-hg-surface p-7">
          <p className="text-[17px] leading-6 font-semibold tracking-[-0.01em] text-hg-ink">{t.reachPerson}</p>
          {issuer.menu.length > 0 ? (
            issuer.menu.map((fact) => (
              <p key={fact.id} className={body}>
                {fact.text}{" "}
                <span className="text-[13px]">
                  (<SourceLink source={fact.source} lang={lang} />)
                </span>
              </p>
            ))
          ) : (
            <p className={body}>{t.noMenu(name)}</p>
          )}
        </div>
        <div className="flex flex-col gap-4 rounded-[28px] bg-hg-ink p-7">
          <p className="text-[17px] leading-6 font-semibold tracking-[-0.01em] text-white">{t.wait}</p>
          {bank ? (
            <>
              {bank.extraStats.length > 0 && (
                <p className="text-[16px] leading-[26px] font-medium text-white/80">
                  {t.reportsDisagree}
                  {bank.extraStats.map((stat, i) => (
                    <span key={stat.id}>
                      {i === 0 ? t.onePuts : t.anotherPuts}
                      <InlineStat stat={stat} tone="dark" lang={lang} />, {t.statLabel(stat.id, stat.label)}.
                    </span>
                  ))}
                </p>
              )}
              <p className="text-[16px] leading-[26px] font-medium text-white/80">
                {t.ourEstimate}
                <InlineStat stat={bank.stats.waitToPerson} tone="dark" lang={lang} />.
              </p>
            </>
          ) : (
            <p className="text-[16px] leading-[26px] font-medium text-white/80">{t.noWaitData(name)}</p>
          )}
        </div>
      </HgSection>

      <HgSection className={cn("flex flex-col gap-6 py-10", sectionPad)}>
        <SectionTitle title={t.before} />
        <div className="grid grid-cols-1 gap-x-10 gap-y-5 rounded-[28px] border border-hg-line p-7 sm:p-8 md:grid-cols-3">
          {[t.before1, t.before2, t.before3].map(([title, text]) => (
            <div key={title} className="flex flex-col gap-1.5">
              <p className="text-[16px] leading-6 font-semibold text-hg-ink">{title}</p>
              <p className={body}>{text}</p>
            </div>
          ))}
        </div>
      </HgSection>

      <HgSection className={cn("flex flex-col gap-6 py-10", sectionPad)}>
        <SectionTitle title={t.say} lead={t.sayLead} />
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <Script title={t.missedTitle} lines={t.missedLines(name)} note={t.missedNote} />
          <Script title={t.rateTitle} lines={t.rateLines(name)} note={t.rateNote} />
        </div>
        <p className="text-[15px] leading-6 font-medium text-hg-muted">
          {t.worth[0]}
          <InlineStat stat={getMarketStat("market-late-fee-waived")} lang={lang} />
          {t.worth[1]}
          <InlineStat stat={getMarketStat("market-apr-ask-success")} lang={lang} />
          {t.worth[2]}
        </p>
      </HgSection>

      <HgSection className={cn("flex flex-col gap-6 py-10", sectionPad)}>
        <SectionTitle title={t.questions(name)} />
        <FaqList items={faq} lang={lang} />
      </HgSection>

      <HgSection className={cn("flex flex-col gap-3 pt-4 pb-12", sectionPad)}>
        {bank && (
          <p className="text-[15px] leading-6 font-medium text-hg-muted">
            {t.moreOn(bank.shortName)}
            <Link href={`/insights/${bank.slug}`} className={link}>
              {t.moreOnLink(bank.name)}
            </Link>
            .
          </p>
        )}
        <p className="text-[15px] leading-6 font-medium text-hg-muted">
          {t.read[0]}
          <Link href="/insights/missed-payment" className={link}>
            {t.read[1]}
          </Link>
          {t.read[2]}
          <Link href="/insights/lower-apr" className={link}>
            {t.read[3]}
          </Link>
          {t.read[4]}
          <Link href="/tools/credit-card-interest-calculator" className={link}>
            {t.read[5]}
          </Link>
          {t.others}
          {others.map((other, i) => (
            <span key={other.slug}>
              {i > 0 && ", "}
              <Link href={phonePath(other, lang)} className={link}>
                {other.name}
              </Link>
            </span>
          ))}
          .
        </p>
        <p className="text-[13px] leading-[18px] font-medium text-hg-muted">{t.disclaimer(name)}</p>
      </HgSection>
    </>
  );
}
