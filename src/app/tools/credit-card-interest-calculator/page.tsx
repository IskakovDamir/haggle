import type { Metadata } from "next";
import Link from "next/link";
import { Calculator } from "@/components/calculator/calculator";
import { FaqList, JsonLd } from "@/components/insights/blocks";
import { Breadcrumbs, CtaBand, SectionTitle, sectionPad } from "@/components/insights/chrome";
import { HgSection } from "@/components/landing-v2/ui";
import { faqJsonLd } from "@/lib/benchmarks/seo";
import { siteUrl } from "@/lib/benchmarks/site";
import { calculatorFaq } from "@/lib/calculator/faq";
import { breadcrumbJsonLd } from "@/lib/directory/seo";
import { cn } from "@/lib/utils";

const PATH = "/tools/credit-card-interest-calculator";
const title = "Credit Card Interest Calculator: See What a Lower APR Saves";
const description =
  "Enter your balance and APR to see this month's interest, a year of interest, how long minimum payments take, and how much a lower rate would save. Free, nothing saved.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: PATH },
  openGraph: { title, description, url: PATH },
};

const link = "font-semibold text-hg-ink-2 underline decoration-hg-ink-2/30 underline-offset-[3px] hover:text-hg-blue";

export default function InterestCalculatorPage() {
  const faq = calculatorFaq();
  return (
    <>
      <JsonLd data={faqJsonLd(faq)} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "Credit card interest calculator",
          url: `${siteUrl()}${PATH}`,
          applicationCategory: "FinanceApplication",
          operatingSystem: "Any",
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
          description,
        }}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Interest calculator", path: PATH },
        ])}
      />

      <HgSection className={cn("flex flex-col gap-5 pt-10 pb-8 lg:pt-14", sectionPad)}>
        <Breadcrumbs items={[{ href: "/", label: "Home" }, { label: "Interest calculator" }]} />
        <h1 className="max-w-[20ch] text-[clamp(34px,5vw,56px)] leading-[1.08] font-semibold tracking-[-0.04em] text-hg-ink">
          Credit card interest calculator <em>and what a lower rate saves</em>
        </h1>
        <p className="max-w-[60ch] text-[18px] leading-7 font-medium tracking-[-0.01em] text-hg-muted">
          Type your balance and APR. You will see what the card costs you this month and this year, how long the minimum payment takes to clear it, and
          how much a rate cut would save.
        </p>
      </HgSection>

      <HgSection className={cn("pb-10", sectionPad)}>
        <Calculator />
      </HgSection>

      <HgSection className={cn("flex flex-col gap-6 py-10", sectionPad)}>
        <SectionTitle title="Questions about card interest" />
        <FaqList items={faq} />
        <p className="text-[15px] leading-6 font-medium text-hg-muted">
          Ready to ask? See{" "}
          <Link href="/insights/lower-apr" className={link}>
            how each bank handles rate cuts
          </Link>{" "}
          and{" "}
          <Link href="/phone" className={link}>
            the number to call
          </Link>
          .
        </p>
      </HgSection>

      <CtaBand
        title="Rather not make the call yourself?"
        lead="Haggle calls your card issuer, waits on hold, and asks for a lower rate. You pay only if the bank says yes."
        actions={[
          { href: "/start", label: "Have Haggle ask for a lower rate" },
          { href: "/missed", label: "Have Haggle call about a missed payment" },
        ]}
      />
    </>
  );
}
