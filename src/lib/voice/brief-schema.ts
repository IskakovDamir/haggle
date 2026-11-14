// The brief as the voice route accepts it. The browser builds the brief and sends it to us, and its
// strings end up inside the agent's instructions, so it is checked like any other input: a known
// shape and short single-line strings.
import { z } from "zod";
import { MAX_REQUEST_CHARS } from "@/lib/negotiator/own-request";
import type { NegotiationBrief } from "@/lib/types";

/** One short line. Line breaks are refused so a field cannot pose as a new section of the prompt. */
const line = (maxLength: number) =>
  z
    .string()
    .trim()
    .min(1)
    .max(maxLength)
    .regex(/^[^\r\n]*$/);

const cents = z.number().int().min(0).max(100_000_000_00);
const aprBps = z.number().int().min(0).max(100_00);

export const briefSchema: z.ZodType<NegotiationBrief> = z.object({
  holderFirstName: line(40),
  issuer: z.enum(["chase", "capital_one", "citi", "amex", "discover", "bank_of_america", "wells_fargo", "other"]),
  issuerName: line(60),
  cardName: line(80),
  last4: z
    .string()
    .regex(/^\d{4}$/)
    .nullable(),
  goal: z.enum([
    "missed_payment",
    "apr_reduction",
    "annual_fee_waiver",
    "late_fee_refund",
    "credit_limit_increase",
    "balance_transfer",
    "penalty_apr_review",
  ]),
  facts: z.array(line(200)).max(12),
  balanceCents: cents,
  currentAprBps: aprBps,
  annualFeeCents: cents,
  askAprBps: aprBps.nullable(),
  acceptAprBps: aprBps.nullable(),
  fallback: line(200),
  disclosures: z.array(line(200)).min(1).max(5),
  language: z.enum(["en", "es"]).optional(),
  request: line(MAX_REQUEST_CHARS).optional(),
});
