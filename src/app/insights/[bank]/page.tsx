import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { FaqList, JsonLd, Timeline } from "@/components/insights/blocks";
import { CtaBand, PageIntro, SectionTitle, sectionPad } from "@/components/insights/chrome";
import { InlineStat, SourceLink, StatFigure } from "@/components/insights/provenance";
import { HgButton, HgSection } from "@/components/landing-v2/ui";
import { BANKS, DATASET_AS_OF, MISSED_PAYMENT_TIMELINE, getBank, getMarketStat } from "@/lib/benchmarks";
import { bankFaq } from "@/lib/benchmarks/faq";
import { faqJsonLd } from "@/lib/benchmarks/seo";
import type { Bank } from "@/lib/benchmarks/types";
import { cn } from "@/lib/utils";

export function generateStaticParams() {
  return BANKS.map((bank) => ({ bank: bank.slug }));
}

function copy(bank: Bank) {
  const name = bank.shortName;
  return {
    title: `Missed a ${name} credit card payment? What happens and how to get the late fee back`,
    description: `What happens after a missed ${name} payment, how often ${name} refunds late fees, how much of a rate cut to ask for, and how long you wait for a person. Every number sourced or labelled.`,
  };
}

export async function generateMetadata({ params }: PageProps<"/insights/[bank]">): Promise<Metadata> {
  const bank = getBank((await params).bank);
  if (!bank) return {};
  const { title, description } = copy(bank);
  const path = `/insights/${bank.slug}`;
  return { title, description, alternates: { canonical: path }, openGraph: { title, description, url: path } };
}

/** The deep blue headline band from the landing's "Your bank would rather say yes" block. */
function Headline({ bank }: { bank: Bank }) {
  const { satisfaction, waitToPerson, lateFeeRefundRate, typicalAprCut } = bank.stats;
  return (
    <HgSection className={cn("py-6", sectionPad)}>
      <div
        className="relative isolate overflow-hidden rounded-[40px] p-6 md:p-12 xl:pr-[380px]"
        style={{ backgroundImage: "linear-gradient(161.82deg, #2453e6 14.286%, #0f2a9e 85.714%)" }}
      >
        <h2 className="text-[clamp(26px,3.4vw,36px)] leading-[1.15] font-semibold tracking-[-0.035em] text-white">
          {bank.name} in four numbers
        </h2>
        <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-2">
          <StatFigure stat={lateFeeRefundRate} tone="dark" label="of late fee refund requests granted" />
          <StatFigure stat={typicalAprCut} tone="dark" label="typical rate cut when the answer is yes" />
          <StatFigure stat={waitToPerson} tone="dark" label="to reach a person" />
          <StatFigure stat={satisfaction} tone="dark" label="J.D. Power satisfaction score, out of 1,000" />
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

// The page reads `params` inside a Suspense boundary so a client navigation can show the shell at once.
// Every bank is prerendered by generateStaticParams, so a page load gets the full HTML.
export default function BankPage({ params }: PageProps<"/insights/[bank]">) {
  return (
    <Suspense fallback={<div className="min-h-[80vh]" />}>
      <BankView params={params} />
    </Suspense>
  );
}

async function BankView({ params }: { params: PageProps<"/insights/[bank]">["params"] }) {
  const bank = getBank((await params).bank);
  if (!bank) notFound();
  const name = bank.shortName;
  const faq = bankFaq(bank);
  const others = BANKS.filter((b) => b.slug !== bank.slug);
  const missedHref = `/missed?bank=${bank.slug}`;
  const startHref = `/start?bank=${bank.slug}`;

  return (
    <>
      <JsonLd data={faqJsonLd(faq)} />
      <PageIntro
        crumbs={[{ href: "/", label: "Home" }, { href: "/insights", label: "Insights" }, { label: bank.name }]}
        title={
          <>
            {bank.name} credit cards <em>late fees and lower rates</em>
          </>
        }
        lead={`What happens after a missed ${name} payment, how to get the late fee back, and what to expect when you ask ${name} for a lower rate.`}
        asOf={DATASET_AS_OF}
      />

      <Headline bank={bank} />

      <HgSection className={cn("grid grid-cols-1 gap-10 py-12 lg:grid-cols-[1fr_380px] lg:gap-16", sectionPad)}>
        <div className="flex flex-col gap-8">
          <SectionTitle id="missed-payment" title="If you missed a payment" lead="The rules below apply to every big card issuer, including this one." />
          <Timeline steps={MISSED_PAYMENT_TIMELINE} />
        </div>
        <aside className="flex flex-col gap-6 self-start rounded-[28px] bg-hg-surface p-7">
          <p className="text-[17px] leading-6 font-semibold tracking-[-0.01em] text-hg-ink">Late fees at {name}</p>
          <StatFigure stat={bank.stats.lateFeeMax} size="m" />
          <StatFigure stat={bank.stats.lateFeeRefundRate} size="m" />
          <StatFigure stat={getMarketStat("market-late-fee-waived")} size="m" />
          {bank.facts.map((fact) => (
            <p key={fact.id} className="text-[15px] leading-6 font-medium text-hg-ink-2">
              {fact.text} <span className="text-[13px]">(<SourceLink source={fact.source} />{fact.note ? `. ${fact.note}` : ""})</span>
            </p>
          ))}
          <HgButton href={missedHref} arrow className="whitespace-normal text-center">
            Have Haggle call {name} about a missed payment
          </HgButton>
        </aside>
      </HgSection>

      <HgSection className={cn("flex flex-col gap-8 py-12", sectionPad)}>
        <SectionTitle
          id="lower-rate"
          title="If your rate is too high"
          lead={`Banks keep retention teams that can cut your rate before you leave. Here is how often asking works, and what to expect from ${name}.`}
        />
        <div className="grid grid-cols-1 gap-8 rounded-[28px] border border-hg-line p-7 sm:grid-cols-2 sm:p-8 lg:grid-cols-4">
          <StatFigure stat={getMarketStat("market-apr-ask-success")} />
          <StatFigure stat={getMarketStat("market-apr-cut")} />
          <StatFigure stat={bank.stats.typicalAprCut} />
          <StatFigure stat={getMarketStat("market-average-apr")} />
        </div>
        <HgButton href={startHref} tone="dark" arrow className="self-start whitespace-normal text-center">
          Have Haggle ask {name} for a lower rate
        </HgButton>
      </HgSection>

      <HgSection className={cn("flex flex-col gap-6 py-12", sectionPad)}>
        <SectionTitle id="phone" title={`Calling ${name}`} />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="flex flex-col gap-4 rounded-[28px] bg-hg-surface p-7">
            <p className="text-[17px] leading-6 font-semibold tracking-[-0.01em] text-hg-ink">What the phone menu asks for</p>
            {bank.phoneMenu.length > 0 ? (
              bank.phoneMenu.map((fact) => (
                <p key={fact.id} className="text-[16px] leading-[26px] font-medium text-hg-ink-2">
                  {fact.text} <span className="text-[13px]">(<SourceLink source={fact.source} />)</span>
                </p>
              ))
            ) : (
              <p className="text-[16px] leading-[26px] font-medium text-hg-ink-2">
                We have not found a public source we trust for the {name} menu yet. Haggle will record it on its first calls.
              </p>
            )}
            <p className="text-[16px] leading-[26px] font-medium text-hg-ink-2">
              Haggle never stores your full card number. When the bank needs to verify you, Haggle brings you onto the call to do it yourself.
            </p>
          </div>
          <div className="flex flex-col gap-4 rounded-[28px] bg-hg-ink p-7">
            <p className="text-[17px] leading-6 font-semibold tracking-[-0.01em] text-white">How long you wait</p>
            {bank.extraStats.length > 0 ? (
              <>
                <p className="text-[16px] leading-[26px] font-medium text-white/80">
                  Public reports do not agree.{" "}
                  {bank.extraStats.map((stat, i) => (
                    <span key={stat.id}>
                      {i === 0 ? "One puts it at " : " Another puts it at "}
                      <InlineStat stat={stat} tone="dark" />, the {stat.label}.
                    </span>
                  ))}
                </p>
                <p className="text-[16px] leading-[26px] font-medium text-white/80">
                  Nobody measures this properly, so we will. Until then our estimate is <InlineStat stat={bank.stats.waitToPerson} tone="dark" />.
                </p>
              </>
            ) : (
              <p className="text-[16px] leading-[26px] font-medium text-white/80">
                Our estimate is <InlineStat stat={bank.stats.waitToPerson} tone="dark" />. Haggle waits on hold for you and brings you in only when a person picks up.
              </p>
            )}
          </div>
        </div>
      </HgSection>

      <HgSection className={cn("flex flex-col gap-6 py-12", sectionPad)}>
        <SectionTitle id="faq" title={`Questions about ${name}`} />
        <FaqList items={faq} />
      </HgSection>

      <CtaBand
        title={`Let Haggle call ${name}`}
        lead="It says it is an AI assistant, waits on hold, and asks for exactly what you want. You pay only if the bank says yes."
        actions={[
          { href: missedHref, label: `Have Haggle call ${name} about a missed payment` },
          { href: startHref, label: `Have Haggle ask ${name} for a lower rate` },
        ]}
      />

      <HgSection className={cn("pb-10", sectionPad)}>
        <p className="text-[15px] leading-6 font-medium text-hg-muted">
          Compare with{" "}
          {others.map((other, i) => (
            <span key={other.slug}>
              {i > 0 && (i === others.length - 1 ? " and " : ", ")}
              <Link href={`/insights/${other.slug}`} className="font-semibold text-hg-ink-2 underline decoration-hg-ink-2/30 underline-offset-[3px] hover:text-hg-blue">
                {other.name}
              </Link>
            </span>
          ))}
          , or read the comparisons for a{" "}
          <Link href="/insights/missed-payment" className="font-semibold text-hg-ink-2 underline decoration-hg-ink-2/30 underline-offset-[3px] hover:text-hg-blue">
            missed payment
          </Link>{" "}
          and a{" "}
          <Link href="/insights/lower-apr" className="font-semibold text-hg-ink-2 underline decoration-hg-ink-2/30 underline-offset-[3px] hover:text-hg-blue">
            lower APR
          </Link>
          .
        </p>
      </HgSection>
    </>
  );
}
