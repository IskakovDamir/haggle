import type { Metadata } from "next";
import Link from "next/link";
import { DirectoryTable } from "@/components/directory/blocks";
import { JsonLd } from "@/components/insights/blocks";
import { CtaBand, PageIntro, SectionTitle, sectionPad } from "@/components/insights/chrome";
import { InlineStat } from "@/components/insights/provenance";
import { HgSection } from "@/components/landing-v2/ui";
import { getMarketStat } from "@/lib/benchmarks";
import { DIRECTORY_AS_OF, issuersAtoZ } from "@/lib/directory";
import { breadcrumbJsonLd, directoryListJsonLd } from "@/lib/directory/seo";
import { cn } from "@/lib/utils";

const title = "Credit card customer service phone numbers for every major US issuer";
const description =
  "Official customer service numbers for Chase, Amex, Citi, Capital One, Bank of America, Discover and more, each checked on the bank's own site, plus what to say when you call.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/phone" },
  openGraph: { title, description, url: "/phone" },
};

export default function PhoneIndex() {
  const issuers = issuersAtoZ();
  return (
    <>
      <JsonLd data={directoryListJsonLd(issuers)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Phone numbers", path: "/phone" },
        ])}
      />
      <PageIntro
        crumbs={[{ href: "/", label: "Home" }, { label: "Phone numbers" }]}
        title={
          <>
            Credit card phone numbers, <em>checked at the source</em>
          </>
        }
        lead="Every number here comes from the card issuer's own website, with a link to the page and the date we checked it. Each page also says what to have ready and what to ask for."
        asOf={DIRECTORY_AS_OF}
        art={{ src: "/landing/demo/3d-phone.png", rotate: -14 }}
      />

      <HgSection className={cn("flex flex-col gap-6 py-6", sectionPad)}>
        <SectionTitle title="Card issuers, A to Z" />
        <DirectoryTable issuers={issuers} />
        <p className="text-[15px] leading-6 font-medium text-hg-muted">
          Calling about a missed payment or a high rate? It usually works: <InlineStat stat={getMarketStat("market-late-fee-waived")} /> of people who asked
          got a late fee waived. See{" "}
          <Link href="/insights" className="font-semibold text-hg-ink-2 underline decoration-hg-ink-2/30 underline-offset-[3px] hover:text-hg-blue">
            how the big banks compare
          </Link>
          .
        </p>
      </HgSection>

      <CtaBand
        title="Rather not wait on hold?"
        lead="Haggle calls your card issuer, waits on hold, and asks for the fee back or a lower rate. You pay only if the bank says yes."
        actions={[
          { href: "/missed", label: "Have Haggle call about a missed payment" },
          { href: "/start", label: "Have Haggle ask for a lower rate" },
        ]}
      />
    </>
  );
}
