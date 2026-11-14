import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BankTable, JsonLd } from "@/components/insights/blocks";
import { CtaBand, PageIntro, SectionTitle, sectionPad } from "@/components/insights/chrome";
import { StatFigure } from "@/components/insights/provenance";
import { StatCards } from "@/components/insights/stat-cards";
import { HgSection } from "@/components/landing-v2/ui";
import { BANKS, DATASET_AS_OF, getMarketStat } from "@/lib/benchmarks";
import { datasetJsonLd } from "@/lib/benchmarks/seo";
import { cn } from "@/lib/utils";

const title = "Credit card benchmarks: late fees, rate cuts and wait times by bank";
const description =
  "84% of cardholders who asked for a lower APR got one. Late fees, refunds, rate cuts and hold times for Chase, Capital One, Citi, Amex and Discover, every number sourced or labelled.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/insights" },
  openGraph: { title, description, url: "/insights" },
};

const HEADLINE = ["market-apr-ask-success", "market-apr-cut", "market-late-fee-waived", "market-annual-fee-waived"];
const CONTEXT = [
  "market-card-balances",
  "market-average-apr",
  "market-late-fee-cap-first",
  "market-late-fee-cap-repeat",
  "market-satisfaction-average",
];

const TOPIC_CARDS = [
  {
    href: "/insights/missed-payment",
    title: "Missed a payment",
    second: "and want the fee back",
    body: "What happens day by day, and which banks refund the late fee most often.",
    bg: "linear-gradient(133.83deg, #1e2740 14.286%, #0b1220 85.714%)",
    art: "/landing/wins/3d-bell.png",
  },
  {
    href: "/insights/lower-apr",
    title: "Rate too high",
    second: "and want it lower",
    body: "How often asking works, and how big a cut each bank tends to give.",
    bg: "linear-gradient(161.82deg, #2453e6 14.286%, #0f2a9e 85.714%)",
    art: "/landing/wins/3d-arrow-down.png",
  },
];

export default function InsightsIndex() {
  return (
    <>
      <JsonLd data={datasetJsonLd()} />
      <PageIntro
        crumbs={[{ href: "/", label: "Home" }, { label: "Insights" }]}
        title="Credit card numbers, with every source showing"
        lead="Most people who ask their bank for a lower rate or a fee refund get one. Few ever ask. Here is what the public data says, bank by bank, and where our own estimates fill the gaps."
        asOf={DATASET_AS_OF}
        art={{ src: "/landing/wins/3d-gauge.png", rotate: -6 }}
      />

      <HgSection className={cn("flex flex-col gap-6 py-6", sectionPad)}>
        <SectionTitle title="Asking works" lead="From LendingTree's survey of US cardholders, published in September 2026." />
        <StatCards stats={HEADLINE.map(getMarketStat)} />
        <ul className="grid grid-cols-1 gap-x-8 gap-y-8 rounded-[28px] border border-hg-line px-6 py-7 sm:grid-cols-2 sm:px-8 lg:grid-cols-5">
          {CONTEXT.map((id) => (
            <li key={id}>
              <StatFigure stat={getMarketStat(id)} size="m" />
            </li>
          ))}
        </ul>
      </HgSection>

      <HgSection className={cn("flex flex-col gap-6 py-10", sectionPad)}>
        <SectionTitle
          title="Five banks, side by side"
          lead="Satisfaction scores come from J.D. Power. Wait times, late fees and rate cuts are our estimates for now, and each column says so."
        />
        <BankTable
          banks={BANKS}
          metrics={["satisfaction", "waitToPerson", "lateFeeMax", "lateFeeRefundRate", "typicalAprCut"]}
          label="Five banks compared on satisfaction, wait, late fees and rate cuts"
        />
        <p className="text-[15px] leading-6 font-medium text-hg-muted">
          Read more about{" "}
          {BANKS.map((bank, i) => (
            <span key={bank.slug}>
              {i > 0 && (i === BANKS.length - 1 ? " and " : ", ")}
              <Link href={`/insights/${bank.slug}`} className="font-semibold text-hg-ink-2 underline decoration-hg-ink-2/30 underline-offset-[3px] hover:text-hg-blue">
                {bank.name}
              </Link>
            </span>
          ))}
          .
        </p>
      </HgSection>

      <HgSection className={cn("flex flex-col gap-6 py-6", sectionPad)}>
        <SectionTitle title="Start from your problem" />
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {TOPIC_CARDS.map((card) => (
            <li key={card.href}>
              <Link
                href={card.href}
                className="group relative isolate flex min-h-[240px] flex-col gap-3 overflow-hidden rounded-[28px] p-7 transition-transform duration-300 hover:-translate-y-0.5 md:pr-[220px]"
                style={{ backgroundImage: card.bg }}
              >
                <span className="text-[32px] leading-[38px] font-semibold tracking-[-0.03em] text-white">
                  {card.title}
                  <span className="block text-white/55">{card.second}</span>
                </span>
                <span className="max-w-[34ch] text-[15px] leading-6 font-medium text-white/75">{card.body}</span>
                <span className="mt-auto text-[13px] leading-[18px] font-semibold tracking-[0.04em] text-white uppercase">Read the comparison</span>
                <span aria-hidden className="pointer-events-none absolute -right-6 -bottom-10 -z-10 size-[230px] transition-transform duration-500 group-hover:scale-105">
                  <Image src={card.art} alt="" fill sizes="230px" className="object-contain" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </HgSection>

      <CtaBand
        title="Haggle makes the call for you"
        lead="It waits on hold, asks for the fee back or a lower rate, and you pay only if the bank says yes."
        actions={[
          { href: "/missed", label: "Have Haggle call about a missed payment" },
          { href: "/start", label: "Have Haggle ask for a lower rate" },
        ]}
      />
    </>
  );
}
