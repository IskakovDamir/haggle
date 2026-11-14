// fast-check generators for the engine's property tests only. Nothing in the app imports this file.
import fc from "fast-check";
import { addDays } from "@/lib/format";
import type { CallOutcome, CardAccount } from "@/lib/types";
import { card } from "./test-cards";

/** Balances from nothing to $100,000.00. */
export const balanceCents = fc.integer({ min: 0, max: 10_000_000 });

/** APRs from 0% to 40%, the range the statement checks accept. */
export const aprBps = fc.integer({ min: 0, max: 4000 });

/** A calendar day within a few years of the hackathon. */
export const isoDate = fc.integer({ min: -1500, max: 1500 }).map((days) => addDays("2026-11-14", days));

const feeCents = fc.constantFrom(0, 2900, 4100, 9500, 55_000);

/** Any card a statement could produce, including the awkward ones: no balance, no limit, a promo already over. */
export const anyCard: fc.Arbitrary<CardAccount> = fc
  .record({
    balanceCents,
    creditLimitCents: fc.option(fc.integer({ min: 0, max: 5_000_000 }), { nil: null }),
    purchaseAprBps: aprBps,
    penaltyAprBps: fc.option(aprBps, { nil: null }),
    promo: fc.option(fc.record({ aprBps: fc.constantFrom(0, 399), endsOn: isoDate }), { nil: null }),
    annualFeeCents: feeCents,
    lateFeeCents: feeCents,
    issuerName: fc.constantFrom("Chase", "Capital One", ""),
  })
  .map((fields) => card(fields));

/** A handful of cards with distinct ids, as the case file keeps them. */
export const someCards: fc.Arbitrary<CardAccount[]> = fc
  .array(anyCard, { maxLength: 4 })
  .map((cards) => cards.map((each, index) => ({ ...each, id: `card-${index}` })));

const grantedCents = fc.option(fc.integer({ min: 0, max: 100_000 }), { nil: null });

/** Whatever numbers a call could end with, for any result. */
export const anyOutcome: fc.Arbitrary<CallOutcome> = fc.record({
  result: fc.constantFrom<CallOutcome["result"]>("won", "partial", "declined", "unclear"),
  aprAfterBps: fc.option(aprBps, { nil: null }),
  annualFeeWaivedCents: grantedCents,
  lateFeeRefundCents: grantedCents,
  creditLimitAfterCents: grantedCents,
  statementCreditCents: grantedCents,
  followUp: fc.constant(null),
  evidence: fc.constant([]),
  verified: fc.boolean(),
});
