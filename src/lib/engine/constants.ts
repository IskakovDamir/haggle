// Every policy number the engine uses, in one place. Money is integer cents, rates are integer basis points.

/** Minimum payment: 1% of the balance plus the month's interest, at least $25, never more than what is owed. */
export const MIN_PAYMENT = { percentOfBalanceBps: 100, floorCents: 2500 } as const;

/** Haggle's fee: 20% of first-year savings, charged only after a win. */
export const WIN_FEE_BPS = 2000;

/**
 * Figures quoted from a published survey. They live in this one object so a fact check changes a single
 * place and every lever value, success rate and sentence follows.
 */
export const PUBLISHED_FIGURES = {
  source: { label: "LendingTree, 2026", url: "https://www.lendingtree.com/credit-cards/study/lower-apr-ask/" },
  /** Published success rate, in percent, for each ask the survey covers. */
  successRatePct: { apr_reduction: 84, annual_fee_waiver: 94 },
  /** Average APR cut for cardholders who asked, in basis points (6.3 points). */
  expectedAprCutBps: 630,
} as const;

/** Average APR cut for cardholders who ask, used as the expected value before a call. */
export const EXPECTED_APR_CUT_BPS = PUBLISHED_FIGURES.expectedAprCutBps;

/** A balance transfer is valued as 12 months at 0% minus the transfer fee, and suggested only when it pays. */
export const BALANCE_TRANSFER = {
  feeBps: 300,
  minBalanceCents: 100_000,
  minAprBps: 1500,
  /** It comes after the calls, so a lower rate is tried first. */
  dueInDays: 60,
  /** A transfer has to be set up before a promo rate runs out. */
  daysBeforePromoEnds: 30,
} as const;

/** A higher limit is worth asking for once utilization reaches 30%. The ask is a 25% raise. */
export const LIMIT_INCREASE = { minUtilizationPct: 30, raiseBps: 2500, dueInDays: 30 } as const;

/** No payoff simulation runs longer than 100 years. */
export const MAX_PAYOFF_MONTHS = 1200;
