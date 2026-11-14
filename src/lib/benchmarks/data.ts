// The benchmark dataset behind /insights. Each cited figure was checked against its source on Nov 14, 2026.
// Estimates are Haggle demo numbers until our own calls measure them; the pages label them "Estimate".
import { z } from "zod";
import type { Bank, BankMetric, BankSlug, Fact, Source, Stat, TimelineStep, Topic } from "./types";

/** When this dataset was last checked against its sources. */
export const DATASET_AS_OF = "2026-11-14";

const SOURCES = {
  kktv: {
    name: "LendingTree survey, via KKTV",
    url: "https://www.kktv.com/2026/09/02/asking-lower-credit-card-rate-is-working-more-often-survey-finds/",
  },
  fox5: {
    name: "LendingTree survey, via FOX 5 NY",
    url: "https://www.fox5ny.com/money/credit-cardholders-lower-interest-rates-waived-fees-lendingtree-survey",
  },
  nyFed: { name: "Federal Reserve Bank of New York", url: "https://www.newyorkfed.org/newsevents/news/research/2026/20261110" },
  g19: { name: "Federal Reserve G.19", url: "https://www.federalreserve.gov/releases/g19/current/" },
  jdPower: { name: "J.D. Power 2025, via Clark.com", url: "https://clark.com/credit-cards/credit-card-survey-jd-power/" },
  getHuman: { name: "GetHuman", url: "https://gethuman.com/phone-number/Chase-Credit-Cards/customer-service/~15053" },
  getHumanSapphire: { name: "GetHuman", url: "https://gethuman.com/phone-number/Chase-Credit-Cards/customer-service/~3803" },
  doNotPay: { name: "DoNotPay", url: "https://donotpay.com/learn/chase-support-service/" },
  fool: {
    name: "The Motley Fool",
    url: "https://www.fool.com/money/credit-cards/articles/these-are-the-top-5-credit-card-companies-for-customer-satisfaction",
  },
  lateFeeCap: {
    name: "Kilpatrick Townsend",
    url: "https://ktslaw.com/en/Blog/Consumer-Financial-Services/2025/5/CFPB-Credit-Card-Late-Fee-Rule-Vacated-by-Banking-Trade-Group-Lawsuit",
  },
  reg52: { name: "12 CFR 1026.52(b)", url: "https://www.ecfr.gov/on/2024-03-14/title-12/chapter-X/part-1026/subpart-G/section-1026.52" },
  cfpbPenaltyRule: {
    name: "CFPB, 2024 penalty fees rule",
    url: "https://files.consumerfinance.gov/f/documents/cfpb_credit-card-penalty-fees_final-rule_2024-01.pdf",
  },
  reg55: { name: "12 CFR 1026.55(b)(4)", url: "https://www.ecfr.gov/current/title-12/chapter-X/part-1026/subpart-G/section-1026.55" },
} satisfies Record<string, Source>;

export const MARKET_STATS: Stat[] = [
  {
    id: "market-apr-ask-success",
    label: "of cardholders who asked for a lower APR got one",
    value: 8400,
    unit: "share_bps",
    kind: "cited",
    source: SOURCES.kktv,
    asOf: "2026-09-02",
  },
  {
    id: "market-apr-cut",
    label: "average rate cut for those who got one",
    value: 630,
    unit: "points_bps",
    kind: "cited",
    source: SOURCES.kktv,
    asOf: "2026-09-02",
  },
  {
    id: "market-late-fee-waived",
    label: "of people who asked to waive a late fee got it",
    value: 9200,
    unit: "share_bps",
    kind: "cited",
    source: SOURCES.fox5,
    asOf: "2026-09-03",
  },
  {
    id: "market-annual-fee-waived",
    label: "who asked got an annual fee waived or reduced",
    value: 9400,
    unit: "share_bps",
    kind: "cited",
    source: SOURCES.fox5,
    asOf: "2026-09-03",
  },
  {
    id: "market-card-balances",
    label: "in US credit card balances, Q3 2026",
    value: 128_500_000_000_000,
    unit: "cents",
    kind: "cited",
    source: SOURCES.nyFed,
    asOf: "2026-11-10",
  },
  {
    id: "market-average-apr",
    label: "average APR on accounts charged interest, August 2026",
    value: 2236,
    unit: "apr_bps",
    kind: "cited",
    source: SOURCES.g19,
    asOf: "2026-11-06",
  },
  {
    id: "market-late-fee-cap-first",
    label: "most a big issuer can charge for a first late payment",
    value: 3000,
    unit: "cents",
    kind: "cited",
    source: SOURCES.lateFeeCap,
    asOf: "2025-05-05",
    note: "The 2024 rule that cut this to $8 was vacated by a court on April 15, 2025, so the earlier safe harbor amounts apply.",
  },
  {
    id: "market-late-fee-cap-repeat",
    label: "most it can charge if you were late again within six billing cycles",
    value: 4100,
    unit: "cents",
    kind: "cited",
    source: SOURCES.lateFeeCap,
    asOf: "2025-05-05",
  },
  {
    id: "market-satisfaction-average",
    label: "average J.D. Power 2025 credit card satisfaction score",
    value: 612,
    unit: "score",
    kind: "cited",
    source: SOURCES.jdPower,
    asOf: "2026-04-21",
  },
];

/** What happens after a missed payment. Wording follows each source. */
export const MISSED_PAYMENT_TIMELINE: TimelineStep[] = [
  {
    id: "timeline-late-fee",
    when: "The day after the due date",
    text: "The issuer can charge a late fee. For a big issuer it can be up to $30 the first time, and up to $41 if you were also late in one of the six billing cycles before.",
    kind: "cited",
    source: SOURCES.reg52,
    asOf: DATASET_AS_OF,
  },
  {
    id: "timeline-credit-report",
    when: "About 30 days late",
    text: "Issuers report the late payment to the credit bureaus after about 30 days, and your credit score may drop.",
    kind: "cited",
    source: SOURCES.cfpbPenaltyRule,
    asOf: "2024-03-05",
  },
  {
    id: "timeline-penalty-rate",
    when: "60 days late",
    text: "Only once a minimum payment is more than 60 days late can the issuer apply a penalty rate to the balance you already have.",
    kind: "cited",
    source: SOURCES.reg55,
    asOf: DATASET_AS_OF,
  },
  {
    id: "timeline-rate-restored",
    when: "Six on-time payments later",
    text: "If you then make six minimum payments in a row on time, the issuer must bring the rate on that balance back down to what it was before.",
    kind: "cited",
    source: SOURCES.reg55,
    asOf: DATASET_AS_OF,
  },
];

const ESTIMATE_NOTE = "Haggle demo estimate. We will replace it with numbers measured on our own calls.";

type BankRow = {
  slug: BankSlug;
  name: string;
  shortName: string;
  satisfaction: number;
  waitSeconds: number;
  lateFeeMaxCents: number;
  lateFeeRefundBps: number;
  aprCutBps: number;
};

/** One line per bank, as in the research table. */
const ROWS: BankRow[] = [
  { slug: "chase", name: "Chase", shortName: "Chase", satisfaction: 619, waitSeconds: 540, lateFeeMaxCents: 4000, lateFeeRefundBps: 8800, aprCutBps: 550 },
  { slug: "capital-one", name: "Capital One", shortName: "Capital One", satisfaction: 621, waitSeconds: 360, lateFeeMaxCents: 4000, lateFeeRefundBps: 8500, aprCutBps: 400 },
  { slug: "citi", name: "Citi", shortName: "Citi", satisfaction: 608, waitSeconds: 660, lateFeeMaxCents: 4100, lateFeeRefundBps: 9000, aprCutBps: 600 },
  { slug: "amex", name: "American Express", shortName: "Amex", satisfaction: 643, waitSeconds: 240, lateFeeMaxCents: 4000, lateFeeRefundBps: 9500, aprCutBps: 650 },
  { slug: "discover", name: "Discover", shortName: "Discover", satisfaction: 617, waitSeconds: 300, lateFeeMaxCents: 4100, lateFeeRefundBps: 9600, aprCutBps: 500 },
];

function bankStats(row: BankRow): Record<BankMetric, Stat> {
  const estimate = (id: string, label: string, value: number, unit: Stat["unit"]): Stat => ({
    id: `${row.slug}-${id}`,
    label,
    value,
    unit,
    kind: "estimate",
    asOf: DATASET_AS_OF,
    note: ESTIMATE_NOTE,
  });
  return {
    satisfaction: {
      id: `${row.slug}-satisfaction`,
      label: `${row.shortName} customer satisfaction score, out of 1,000`,
      value: row.satisfaction,
      unit: "score",
      kind: "cited",
      source: SOURCES.jdPower,
      asOf: "2026-04-21",
    },
    waitToPerson: estimate("wait-to-person", `wait to reach a person at ${row.shortName}`, row.waitSeconds, "seconds"),
    lateFeeMax: estimate("late-fee-max", `highest late fee on a ${row.shortName} card`, row.lateFeeMaxCents, "cents"),
    lateFeeRefundRate: estimate("late-fee-refund", `of late fee refund requests ${row.shortName} grants`, row.lateFeeRefundBps, "share_bps"),
    typicalAprCut: estimate("apr-cut", `typical rate cut when ${row.shortName} says yes`, row.aprCutBps, "points_bps"),
  };
}

const EXTRA_STATS: Partial<Record<BankSlug, Stat[]>> = {
  chase: [
    {
      id: "chase-hold-gethuman",
      label: "average hold on the Chase card international line, from 783 calls in 90 days",
      value: 240,
      unit: "seconds",
      kind: "cited",
      source: SOURCES.getHuman,
      asOf: "2025-11-14",
    },
    {
      id: "chase-hold-donotpay",
      label: "usual hold on the main Chase line",
      value: 1200,
      unit: "seconds",
      kind: "cited",
      source: SOURCES.doNotPay,
      asOf: "2023-08-17",
    },
  ],
};

const PHONE_MENU: Partial<Record<BankSlug, Fact[]>> = {
  chase: [
    {
      id: "chase-menu-card-number",
      text: "On the Chase Sapphire line, the first prompt asks for your full 16-digit card number.",
      kind: "cited",
      source: SOURCES.getHumanSapphire,
      asOf: "2026-11-04",
    },
  ],
};

const FACTS: Partial<Record<BankSlug, Fact[]>> = {
  discover: [
    {
      id: "discover-first-late-fee",
      text: "Discover automatically waives your first late fee.",
      kind: "cited",
      source: SOURCES.fool,
      asOf: "2026-05-26",
      note: "The article was first published in 2021 and last updated in May 2026.",
    },
  ],
};

export const BANKS: Bank[] = ROWS.map((row) => ({
  slug: row.slug,
  name: row.name,
  shortName: row.shortName,
  stats: bankStats(row),
  extraStats: EXTRA_STATS[row.slug] ?? [],
  phoneMenu: PHONE_MENU[row.slug] ?? [],
  facts: FACTS[row.slug] ?? [],
}));

export const TOPICS: Topic[] = [
  {
    slug: "missed-payment",
    title: "Missed a credit card payment? How each bank handles the late fee",
    description:
      "What happens after a missed credit card payment, and how Chase, Capital One, Citi, Amex and Discover compare on late fees and refunds.",
    sortBy: "lateFeeRefundRate",
    ctaPath: "/missed",
    ctaLabel: "Have Haggle call your bank about a missed payment",
  },
  {
    slug: "lower-apr",
    title: "How to get a lower credit card APR, bank by bank",
    description:
      "Most cardholders who ask for a lower rate get one. How Chase, Capital One, Citi, Amex and Discover compare on rate cuts and wait times.",
    sortBy: "typicalAprCut",
    ctaPath: "/start",
    ctaLabel: "Have Haggle ask your bank for a lower rate",
  },
];

// Validation: the dataset is checked when this module loads, so a bad edit fails the build and the tests.
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const source = z.object({ name: z.string().min(1), url: z.url() });

export const statSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9-]+$/),
    label: z.string().min(1),
    value: z.number().int(),
    unit: z.enum(["cents", "share_bps", "apr_bps", "points_bps", "seconds", "score"]),
    kind: z.enum(["measured", "cited", "estimate"]),
    source: source.optional(),
    asOf: isoDate,
    note: z.string().optional(),
  })
  .refine((s) => s.kind !== "cited" || s.source !== undefined, { message: "A cited stat needs a source" })
  .refine((s) => s.kind !== "estimate" || s.source === undefined, { message: "An estimate has no source link" })
  .refine((s) => s.unit !== "share_bps" || (s.value >= 0 && s.value <= 10_000), { message: "A share is between 0% and 100%" });

const factSchema = z.object({ id: z.string(), text: z.string().min(1), kind: z.literal("cited"), source, asOf: isoDate, note: z.string().optional() });
const stepSchema = z.object({ id: z.string(), when: z.string().min(1), text: z.string().min(1), kind: z.literal("cited"), source, asOf: isoDate });

export const datasetSchema = z.object({
  market: z.array(statSchema),
  timeline: z.array(stepSchema),
  banks: z.array(
    z.object({
      slug: z.string(),
      name: z.string(),
      shortName: z.string(),
      stats: z.record(z.string(), statSchema),
      extraStats: z.array(statSchema),
      phoneMenu: z.array(factSchema),
      facts: z.array(factSchema),
    }),
  ),
});

datasetSchema.parse({ market: MARKET_STATS, timeline: MISSED_PAYMENT_TIMELINE, banks: BANKS });
