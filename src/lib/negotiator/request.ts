// The body both routes accept: { brief, turns }. The brief is built in the browser and comes back to
// us on every request, so it is checked like any other input: known shape, short single-line strings.
import { z } from "zod";
import type { NegotiationBrief, Turn } from "@/lib/types";

export type CallLimits = { maxTurns: number; maxTurnChars: number };

/** A live typed call: 40 turns of at most 1,000 characters. */
export const NEGOTIATE_LIMITS: CallLimits = { maxTurns: 40, maxTurnChars: 1000 };
/**
 * A finished call, typed or spoken. Wider than the live limits because the transcript also holds the
 * agent's last reply, and speech turned to text can run longer than a typed line.
 */
export const OUTCOME_LIMITS: CallLimits = { maxTurns: 80, maxTurnChars: 2000 };

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

const ISSUERS = ["chase", "capital_one", "citi", "amex", "discover", "bank_of_america", "wells_fargo", "other"] as const;
const GOALS = [
  "missed_payment",
  "apr_reduction",
  "annual_fee_waiver",
  "late_fee_refund",
  "credit_limit_increase",
  "balance_transfer",
  "penalty_apr_review",
] as const;

const briefSchema: z.ZodType<NegotiationBrief> = z.object({
  holderFirstName: line(40),
  issuer: z.enum(ISSUERS),
  issuerName: line(60),
  cardName: line(80),
  last4: z
    .string()
    .regex(/^\d{4}$/)
    .nullable(),
  goal: z.enum(GOALS),
  facts: z.array(line(200)).max(12),
  balanceCents: cents,
  currentAprBps: aprBps,
  annualFeeCents: cents,
  askAprBps: aprBps.nullable(),
  acceptAprBps: aprBps.nullable(),
  fallback: line(200),
  disclosures: z.array(line(200)).min(1).max(5),
});

const turnSchema: z.ZodType<Turn> = z.object({
  role: z.enum(["agent", "bank"]),
  text: z.string().trim().min(1),
  at: z.number().min(0),
});

const bodySchema = z.object({ brief: briefSchema, turns: z.array(turnSchema) });

export type CallBody =
  | { ok: true; brief: NegotiationBrief; turns: Turn[] }
  | { ok: false; code: "bad_request" | "too_large"; message: string };

/** Validate { brief, turns }. A call that is well formed but over the limits is "too_large". */
export function parseCallBody(body: unknown, limits: CallLimits): CallBody {
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    const where = parsed.error.issues[0]?.path.join(".") || "body";
    return { ok: false, code: "bad_request", message: `The request needs a valid brief and a list of turns. Check "${where}".` };
  }

  const { brief, turns } = parsed.data;
  if (turns.length > limits.maxTurns) {
    return { ok: false, code: "too_large", message: `This call is longer than ${limits.maxTurns} turns. End the call to see the result.` };
  }
  if (turns.some((turn) => turn.text.length > limits.maxTurnChars)) {
    const max = limits.maxTurnChars.toLocaleString("en-US");
    return { ok: false, code: "too_large", message: `One turn is longer than ${max} characters. Say it in fewer words.` };
  }
  return { ok: true, brief, turns };
}
