// The shared body of the two topic pages: one problem, five banks compared, sorted by the most useful number.
import type { Metadata } from "next";
import { banksBy, DATASET_AS_OF, getMarketStat } from "@/lib/benchmarks";
import type { FaqItem } from "@/lib/benchmarks/faq";
import { faqJsonLd } from "@/lib/benchmarks/seo";
import type { BankMetric, Topic } from "@/lib/benchmarks/types";
import { cn } from "@/lib/utils";
import { HgButton, HgSection } from "@/components/landing-v2/ui";
import { BankTable, FaqList, JsonLd, METRIC_LABEL } from "./blocks";
import { CtaBand, PageIntro, SectionTitle, sectionPad } from "./chrome";
import { StatFigure } from "./provenance";

export function topicMetadata(topic: Topic): Metadata {
  const path = `/insights/${topic.slug}`;
  return {
    title: topic.title,
    description: topic.description,
    alternates: { canonical: path },
    openGraph: { title: topic.title, description: topic.description, url: path },
  };
}

export function TopicPage({
  topic,
  h1,
  lead,
  art,
  marketStatIds,
  metrics,
  faq,
  children,
}: {
  topic: Topic;
  h1: React.ReactNode;
  lead: string;
  art: string;
  marketStatIds: string[];
  metrics: BankMetric[];
  faq: FaqItem[];
  children?: React.ReactNode;
}) {
  const banks = banksBy(topic.sortBy);
  const [top] = banks;
  return (
    <>
      <JsonLd data={faqJsonLd(faq)} />
      <PageIntro
        crumbs={[{ href: "/", label: "Home" }, { href: "/insights", label: "Insights" }, { label: topic.slug === "missed-payment" ? "Missed payment" : "Lower APR" }]}
        title={h1}
        lead={lead}
        asOf={DATASET_AS_OF}
        art={{ src: art, rotate: -8 }}
      />

      <HgSection className={cn("py-6", sectionPad)}>
        <div className="grid grid-cols-1 gap-8 rounded-[28px] border border-hg-line p-7 sm:grid-cols-2 sm:p-8 lg:grid-cols-4">
          {marketStatIds.map((id) => (
            <StatFigure key={id} stat={getMarketStat(id)} />
          ))}
        </div>
      </HgSection>

      <HgSection className={cn("flex flex-col gap-6 py-10", sectionPad)}>
        <SectionTitle
          title={`Sorted by ${METRIC_LABEL[topic.sortBy].toLowerCase()}`}
          lead={`${top.name} comes first on this measure. The highlighted column is the one the table is sorted by, and each column header says where its numbers come from.`}
        />
        <BankTable banks={banks} metrics={metrics} highlight={topic.sortBy} label={`Banks sorted by ${METRIC_LABEL[topic.sortBy].toLowerCase()}`} />
        <HgButton href={topic.ctaPath} arrow className="self-start whitespace-normal text-center">
          {topic.ctaLabel}
        </HgButton>
      </HgSection>

      {children}

      <HgSection className={cn("flex flex-col gap-6 py-12", sectionPad)}>
        <SectionTitle title="Questions people ask" />
        <FaqList items={faq} />
      </HgSection>

      <CtaBand
        title="Haggle makes the call for you"
        lead="It says it is an AI assistant, waits on hold, and asks for exactly what you want. You pay only if the bank says yes."
        actions={[
          { href: "/missed", label: "Have Haggle call about a missed payment" },
          { href: "/start", label: "Have Haggle ask for a lower rate" },
        ]}
      />
    </>
  );
}
