// The credit card interest calculator: what a balance costs at today's APR and what a rate cut would save.
// Every number is computed by src/lib/engine from what the visitor typed. Nothing here is estimated.
import { EXPECTED_APR_CUT_BPS, MIN_PAYMENT, annualInterestCents, feeForWin, minimumPaymentCents, monthlyInterestCents, simulateMinimumPayments } from "@/lib/engine";
import { getMarketStat } from "@/lib/benchmarks";
import { parseDollarsToCents } from "@/lib/money";
import type { Bps, Cents } from "@/lib/types";

export type CalculatorInput = { balanceCents: Cents; aprBps: Bps; cutBps: Bps };

export type Scenario = {
  aprBps: Bps;
  monthlyInterestCents: Cents;
  annualInterestCents: Cents;
  firstMinimumCents: Cents;
  /** Minimum payments only, until the balance is gone (or the 100-year cap). */
  payoffMonths: number;
  payoffInterestCents: Cents;
  paidOff: boolean;
};

export type CalculatorResult = {
  now: Scenario;
  afterCut: Scenario;
  /** First-year interest saved if the balance stays where it is. */
  yearSavedCents: Cents;
  /** Interest saved over the whole payoff on minimum payments. */
  payoffInterestSavedCents: Cents;
  monthsSaved: number;
  /** Haggle's fee on that first-year saving, and only if the bank says yes. */
  haggleFeeCents: Cents;
};

/** Upper limits that keep the simulation meaningful. Most card APRs are well under 40%. */
export const LIMITS = { maxBalanceCents: 100_000_000, maxAprBps: 4000 } as const;

/** The form's starting values: an example balance, the Fed's average APR and the survey's average cut. */
export function defaultInput(): CalculatorInput {
  return {
    balanceCents: 500_000,
    aprBps: getMarketStat("market-average-apr").value,
    cutBps: EXPECTED_APR_CUT_BPS,
  };
}

function scenario(balanceCents: Cents, aprBps: Bps): Scenario {
  const payoff = simulateMinimumPayments(balanceCents, aprBps);
  return {
    aprBps,
    monthlyInterestCents: monthlyInterestCents(balanceCents, aprBps),
    annualInterestCents: annualInterestCents(balanceCents, aprBps),
    firstMinimumCents: minimumPaymentCents(balanceCents, aprBps),
    payoffMonths: payoff.months,
    payoffInterestCents: payoff.totalInterestCents,
    paidOff: payoff.paidOff,
  };
}

export function calculate(input: CalculatorInput): CalculatorResult {
  const afterApr = Math.max(0, input.aprBps - input.cutBps);
  const now = scenario(input.balanceCents, input.aprBps);
  const afterCut = scenario(input.balanceCents, afterApr);
  const yearSavedCents = now.annualInterestCents - afterCut.annualInterestCents;
  return {
    now,
    afterCut,
    yearSavedCents,
    payoffInterestSavedCents: now.payoffInterestCents - afterCut.payoffInterestCents,
    monthsSaved: now.payoffMonths - afterCut.payoffMonths,
    haggleFeeCents: feeForWin(yearSavedCents),
  };
}

/** "24.99" or "24.99%" -> 2499. Null when it is not a rate with up to two decimals. */
export function parsePercentToBps(input: string): Bps | null {
  const cleaned = input.replace(/[%\s]/g, "");
  if (!/^\d+(\.\d{0,2})?$/.test(cleaned)) return null;
  const [whole, frac = ""] = cleaned.split(".");
  return Number(whole) * 100 + Number(frac.padEnd(2, "0"));
}

export type FieldError = "balance-format" | "balance-max" | "apr-format" | "apr-max" | "cut-format" | "cut-over-apr";
export type FieldErrors = Partial<Record<"balance" | "apr" | "cut", FieldError>>;

/** Read the three fields, or say which one is wrong. The page turns the code into a sentence in its language. */
export function readInput(fields: { balance: string; apr: string; cut: string }): { input: CalculatorInput | null; errors: FieldErrors } {
  const errors: FieldErrors = {};
  const balanceCents = parseDollarsToCents(fields.balance);
  const aprBps = parsePercentToBps(fields.apr);
  const cutBps = parsePercentToBps(fields.cut);

  if (balanceCents === null || balanceCents <= 0) errors.balance = "balance-format";
  else if (balanceCents > LIMITS.maxBalanceCents) errors.balance = "balance-max";
  if (aprBps === null || aprBps <= 0) errors.apr = "apr-format";
  else if (aprBps > LIMITS.maxAprBps) errors.apr = "apr-max";
  if (cutBps === null) errors.cut = "cut-format";
  else if (aprBps !== null && cutBps > aprBps) errors.cut = "cut-over-apr";

  if (Object.keys(errors).length > 0 || balanceCents === null || aprBps === null || cutBps === null) return { input: null, errors };
  return { input: { balanceCents, aprBps, cutBps }, errors };
}

/** The rule the payoff uses, in words, from the engine's own constants. */
export function minimumPaymentRule(lang: "en" | "es" = "en"): string {
  const pct = MIN_PAYMENT.percentOfBalanceBps / 100;
  const floor = MIN_PAYMENT.floorCents / 100;
  return lang === "es"
    ? `${pct}% del saldo más los intereses de ese mes, con un mínimo de $${floor}`
    : `${pct}% of the balance plus that month's interest, at least $${floor}`;
}
