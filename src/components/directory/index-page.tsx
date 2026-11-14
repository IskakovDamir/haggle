// The phone directory index, in English (/phone) or Spanish (/es/telefonos).
import Link from "next/link";
import { DirectoryTable } from "@/components/directory/blocks";
import { JsonLd } from "@/components/insights/blocks";
import { CtaBand, PageIntro, SectionTitle, sectionPad } from "@/components/insights/chrome";
import { InlineStat } from "@/components/insights/provenance";
import { HgSection } from "@/components/landing-v2/ui";
import { getMarketStat } from "@/lib/benchmarks";
import { DIRECTORY_AS_OF, issuersAtoZ } from "@/lib/directory";
import { localizeIssuer, phoneIndexPath } from "@/lib/directory/locale";
import { insightsIndexPath } from "@/lib/benchmarks/locale";
import { breadcrumbJsonLd, directoryListJsonLd } from "@/lib/directory/seo";
import type { Copy, Locale } from "@/lib/i18n/locale";
import { cn } from "@/lib/utils";

type IndexCopy = {
  home: string;
  homePath: string;
  crumb: string;
  title: [string, string];
  lead: string;
  banks: string;
  stores: string;
  storesLead: string;
  worth: [string, string, string];
  compareLink: string;
  ctaTitle: string;
  ctaLead: string;
  ctaMissed: string;
  ctaRate: string;
};

const COPY: Copy<IndexCopy> = {
  en: {
    home: "Home",
    homePath: "/",
    crumb: "Phone numbers",
    title: ["Credit card phone numbers, ", "checked at the source"],
    lead: "Every number here comes from the card issuer's own website, with a link to the page and the date we checked it. Each page also says what to have ready and what to ask for.",
    banks: "Banks and card issuers",
    stores: "Store and payment cards",
    storesLead: "Store cards are run by a bank, so the card line is often different from the store's own customer service.",
    worth: ["Calling about a missed payment or a high rate? It usually works: ", " of people who asked got a late fee waived. See ", "."],
    compareLink: "how the big banks compare",
    ctaTitle: "Rather not wait on hold?",
    ctaLead: "Haggle calls your card issuer, waits on hold, and asks for the fee back or a lower rate. You pay only if the bank says yes.",
    ctaMissed: "Have Haggle call about a missed payment",
    ctaRate: "Have Haggle ask for a lower rate",
  },
  es: {
    home: "Inicio",
    homePath: "/es",
    crumb: "Teléfonos",
    title: ["Teléfonos de tarjetas de crédito, ", "verificados en la fuente"],
    lead: "Cada número sale del sitio oficial del emisor de la tarjeta, con un enlace a la página y la fecha en que lo verificamos. Cada página también dice qué tener a mano y qué pedir.",
    banks: "Bancos y emisores de tarjetas",
    stores: "Tarjetas de tiendas y de pago",
    storesLead: "Las tarjetas de tiendas las maneja un banco, así que la línea de la tarjeta suele ser distinta del servicio al cliente de la tienda.",
    worth: ["¿Llamas por un pago atrasado o una tasa alta? Casi siempre funciona: al ", " de quienes lo pidieron les quitaron el cargo por pago atrasado. Mira ", "."],
    compareLink: "cómo se comparan los grandes bancos",
    ctaTitle: "¿Prefieres no esperar en línea?",
    ctaLead: "Haggle llama al emisor de tu tarjeta, espera en línea y pide que te devuelvan el cargo o te bajen la tasa. Pagas solo si el banco dice que sí.",
    ctaMissed: "Que Haggle llame por un pago atrasado",
    ctaRate: "Que Haggle pida una tasa más baja",
  },
};

export function DirectoryIndexBody({ lang }: { lang: Locale }) {
  const t = COPY[lang];
  const banks = issuersAtoZ("bank").map((i) => localizeIssuer(i, lang));
  const stores = issuersAtoZ("store").map((i) => localizeIssuer(i, lang));
  return (
    <>
      <JsonLd data={directoryListJsonLd(issuersAtoZ(), lang)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: t.home, path: t.homePath },
          { name: t.crumb, path: phoneIndexPath(lang) },
        ])}
      />
      <PageIntro
        crumbs={[{ href: t.homePath, label: t.home }, { label: t.crumb }]}
        title={
          <>
            {t.title[0]}
            <em>{t.title[1]}</em>
          </>
        }
        lead={t.lead}
        asOf={DIRECTORY_AS_OF}
        art={{ src: "/landing/demo/3d-phone.png", rotate: -14 }}
        lang={lang}
      />

      <HgSection className={cn("flex flex-col gap-6 py-6", sectionPad)}>
        <SectionTitle title={t.banks} />
        <DirectoryTable issuers={banks} lang={lang} />
      </HgSection>

      <HgSection className={cn("flex flex-col gap-6 py-6", sectionPad)}>
        <SectionTitle title={t.stores} lead={t.storesLead} />
        <DirectoryTable issuers={stores} lang={lang} />
        <p className="text-[15px] leading-6 font-medium text-hg-muted">
          {t.worth[0]}
          <InlineStat stat={getMarketStat("market-late-fee-waived")} lang={lang} />
          {t.worth[1]}
          <Link href={insightsIndexPath(lang)} className="font-semibold text-hg-ink-2 underline decoration-hg-ink-2/30 underline-offset-[3px] hover:text-hg-blue">
            {t.compareLink}
          </Link>
          {t.worth[2]}
        </p>
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
