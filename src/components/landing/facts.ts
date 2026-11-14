// Every published statistic on the landing page lives here with its source, so each one can be
// checked and corrected in one place. Numbers Haggle computes itself (interest, payoff time) are
// not facts to cite: they come from the engine, see examples.ts.
//
// Three survey figures are also used by the engine to value the plan (the two success rates and the
// average APR cut). They are read from the engine's PUBLISHED_FIGURES here, so the landing page and
// the plan can never quote different numbers. To correct one of those, edit src/lib/engine/constants.ts.
import { EXPECTED_APR_CUT_BPS, PUBLISHED_FIGURES, WIN_FEE_BPS } from "@/lib/engine";
import { formatPoints } from "@/lib/format";

export type Source = { label: string; url: string };

export type Fact = {
  /** The number as printed, for example "84%". */
  value: string;
  /** The rest of the sentence, starting in lower case. */
  claim: string;
  source: Source;
};

export const SOURCES = {
  lendingTree: {
    label: "LendingTree survey, 2026",
    url: "https://www.lendingtree.com/credit-cards/study/lower-apr-ask/",
  },
  newYorkFed: {
    label: "New York Fed, Q3 2026",
    url: "https://www.newyorkfed.org/newsevents/news/research/2026/20261110",
  },
  bankrate: {
    label: "Bankrate survey, January 2026",
    url: "https://www.bankrate.com/press-releases/long-term-credit-card-debt-is-on-the-rise-61-with-credit-card-debt-have-had-it-for-at-least-a-year/",
  },
} satisfies Record<string, Source>;

export const ASK_SUCCESS: Fact = {
  value: `${PUBLISHED_FIGURES.successRatePct.apr_reduction}%`,
  claim: "of cardholders who asked their bank for a lower rate got one",
  source: SOURCES.lendingTree,
};

/** The four numbers under the hero. The first one is shown large. */
export const HERO_FACTS: Fact[] = [
  ASK_SUCCESS,
  {
    value: `${formatPoints(EXPECTED_APR_CUT_BPS)} pts`,
    claim: "average APR cut for those who asked",
    source: SOURCES.lendingTree,
  },
  {
    value: "< 1 in 4",
    claim: "cardholders ask at all",
    source: SOURCES.lendingTree,
  },
  {
    value: "$1.29T",
    claim: "in US credit card debt, a record",
    source: SOURCES.newYorkFed,
  },
];

export const CARRY_A_BALANCE: Fact = {
  value: "47%",
  claim: "of cardholders carry a balance from month to month",
  source: SOURCES.bankrate,
};

export const IN_DEBT_OVER_A_YEAR: Fact = {
  value: "61%",
  claim: "of them have been in card debt for at least a year",
  source: SOURCES.bankrate,
};

export const FEE_WAIVER_SUCCESS: Fact = {
  value: `${PUBLISHED_FIGURES.successRatePct.annual_fee_waiver}%`,
  claim: "of cardholders who asked had their annual fee waived or reduced",
  source: SOURCES.lendingTree,
};

/** Haggle's own price, from the engine: 20% of first-year savings. */
export const WIN_FEE_PERCENT = `${WIN_FEE_BPS / 100}%`;
