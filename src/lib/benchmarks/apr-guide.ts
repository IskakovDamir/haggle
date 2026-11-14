// Numbers for the "how to ask [bank] for a lower APR" guides. Every value is computed by src/lib/engine from
// a cited average APR and our labelled estimate of the bank's cut. Nothing here is typed in by hand.
import { annualInterestCents } from "@/lib/engine";
import { WIN_APR_CUT_BPS } from "@/lib/negotiator/brief";
import { getMarketStat } from "./index";
import type { Bank } from "./types";

/** Example balances for the table: $2,000, $5,000 and $10,000. */
export const GUIDE_BALANCES_CENTS = [200_000, 500_000, 1_000_000] as const;

export type GuideRow = { balanceCents: number; nowCents: number; afterCents: number; savedCents: number };

export type GuideNumbers = {
  /** The cited US average APR the table starts from. */
  aprBps: number;
  /** The bank's estimated cut, from the dataset (labelled Estimate on the page). */
  cutBps: number;
  afterAprBps: number;
  rows: GuideRow[];
  /** The smallest cut Haggle's agent accepts as a win, from the negotiator. */
  winCutBps: number;
};

export function guideNumbers(bank: Bank): GuideNumbers {
  const aprBps = getMarketStat("market-average-apr").value;
  const cutBps = bank.stats.typicalAprCut.value;
  const afterAprBps = Math.max(0, aprBps - cutBps);
  const rows = GUIDE_BALANCES_CENTS.map((balanceCents) => {
    const nowCents = annualInterestCents(balanceCents, aprBps);
    const afterCents = annualInterestCents(balanceCents, afterAprBps);
    return { balanceCents, nowCents, afterCents, savedCents: nowCents - afterCents };
  });
  return { aprBps, cutBps, afterAprBps, rows, winCutBps: WIN_APR_CUT_BPS };
}
