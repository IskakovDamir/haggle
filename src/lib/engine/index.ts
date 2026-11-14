// The engine: what a card's debt costs, which asks are worth making, and what a win is worth.
// Pure functions over integer cents and integer basis points. No I/O, no clock, no model. See SPEC.md, "Engine".
//
//   constants.ts    every policy number, including the published survey figures
//   math.ts         exact integer multiply and divide, rounded half up
//   interest.ts     monthly and yearly interest
//   payoff.ts       the minimum payment rule and the month-by-month simulations
//   utilization.ts  balance / limit
//   percent.ts      percent wording for the sentences
//   levers.ts       the six asks, their eligibility, value and sentences
//   plan.ts         the ordered steps and their dates
//   analyze.ts      everything above for a set of cards
//   savings.ts      first-year savings from a call's outcome, and Haggle's fee

export {
  BALANCE_TRANSFER,
  EXPECTED_APR_CUT_BPS,
  LIMIT_INCREASE,
  MAX_PAYOFF_MONTHS,
  MIN_PAYMENT,
  PUBLISHED_FIGURES,
  WIN_FEE_BPS,
} from "./constants";
export { annualInterestCents, monthlyInterestCents } from "./interest";
export {
  minimumPaymentCents,
  simulateFixedPayment,
  simulateMinimumPayments,
  traceFixedPayment,
  traceMinimumPayments,
} from "./payoff";
export type { PayoffTrace } from "./payoff";
export { utilizationPct } from "./utilization";
export { LEVER_ORDER, leversFor } from "./levers";
export { analyze } from "./analyze";
export { feeForWin, savingsFromOutcome } from "./savings";
