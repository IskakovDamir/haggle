// JSON-LD builders for the insights pages.
import { answerText, type FaqItem } from "./faq";
import { BANKS, DATASET_AS_OF, MARKET_STATS } from "./data";
import { siteUrl } from "./site";

export function faqJsonLd(items: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: answerText(item.answer) },
    })),
  };
}

export function datasetJsonLd() {
  const sample = BANKS[0].stats;
  const variables = [
    ...MARKET_STATS.map((s) => ({ name: s.label, kind: s.kind })),
    ...Object.values(sample).map((s) => ({ name: s.label.replace(BANKS[0].shortName, "the bank"), kind: s.kind })),
  ];
  return {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: "Haggle credit card benchmarks",
    description:
      "Late fees, late fee refunds, rate cuts, wait times and satisfaction scores for Chase, Capital One, Citi, American Express and Discover, plus US market figures. Each number is labelled as cited from a public source or as a Haggle estimate.",
    url: `${siteUrl()}/insights`,
    dateModified: DATASET_AS_OF,
    temporalCoverage: `2023-08-17/${DATASET_AS_OF}`,
    spatialCoverage: "United States",
    creator: { "@type": "Organization", name: "Haggle", url: siteUrl() },
    isAccessibleForFree: true,
    variableMeasured: variables.map((v) => ({
      "@type": "PropertyValue",
      name: v.name,
      description: v.kind === "estimate" ? "Haggle estimate" : v.kind === "cited" ? "Cited from a public source" : "Measured by Haggle",
    })),
    citation: [...new Set(MARKET_STATS.flatMap((s) => (s.source ? [s.source.url] : [])))],
  };
}
