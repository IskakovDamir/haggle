// Benchmark data for the /insights pages. Every number carries where it came from, in code and on screen.
// Money is integer cents. Rates, rate cuts and shares are integer basis points (84% = 8400). Durations are seconds.

/**
 * - measured: Haggle measured it on its own calls.
 * - cited: taken from a public source, shown with a link to it.
 * - estimate: a Haggle demo estimate, shown with the word "Estimate".
 */
export type StatKind = "measured" | "cited" | "estimate";

/**
 * - cents: money.
 * - share_bps: a share of people or requests (84% = 8400).
 * - apr_bps: an interest rate (22.36% = 2236).
 * - points_bps: a rate cut in percentage points (6.3 points = 630).
 * - seconds: a wait.
 * - score: a survey score with no unit (J.D. Power uses a 1,000-point scale).
 */
export type StatUnit = "cents" | "share_bps" | "apr_bps" | "points_bps" | "seconds" | "score";

export type Source = { name: string; url: string };

export type Stat = {
  id: string;
  label: string;
  value: number;
  unit: StatUnit;
  kind: StatKind;
  source?: Source;
  /** ISO date the figure was published or last updated by its source, or the date of our estimate. */
  asOf: string;
  note?: string;
};

/** A sourced statement with no single headline number, such as what a phone menu asks for. */
export type Fact = {
  id: string;
  text: string;
  kind: "cited";
  source: Source;
  asOf: string;
  note?: string;
};

/** One step of what happens after a missed payment. */
export type TimelineStep = {
  id: string;
  when: string;
  text: string;
  kind: "cited";
  source: Source;
  asOf: string;
};

export type BankSlug = "chase" | "capital-one" | "citi" | "amex" | "discover";

/** The five numbers every bank has, so the comparison tables line up. */
export type BankMetric = "satisfaction" | "waitToPerson" | "lateFeeMax" | "lateFeeRefundRate" | "typicalAprCut";

export type Bank = {
  slug: BankSlug;
  /** "American Express" */
  name: string;
  /** "Amex", for headlines and buttons. */
  shortName: string;
  stats: Record<BankMetric, Stat>;
  /** Extra sourced numbers for this bank only, such as public hold time reports. */
  extraStats: Stat[];
  /** What the phone line asks for, when a source says so. */
  phoneMenu: Fact[];
  /** Other sourced facts about this bank. */
  facts: Fact[];
};

export type TopicSlug = "missed-payment" | "lower-apr";

export type Topic = {
  slug: TopicSlug;
  title: string;
  description: string;
  /** The bank metric the comparison table is sorted by, highest first. */
  sortBy: BankMetric;
  /** Where the call to action sends the visitor. */
  ctaPath: "/missed" | "/start";
  ctaLabel: string;
};
