// The browser's calls to our own API routes. Every response is checked against a schema, and every
// failure becomes one plain sentence the page can print as is.
import { z } from "zod";
import type { CallOutcome, Capabilities, NegotiationBrief, Turn } from "@/lib/types";

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string; code: string };

const UNREACHABLE = "We could not reach the server. Check your connection and try again.";
const UNREADABLE = "The server sent something we could not read. Please try again.";

const problemSchema = z.object({ error: z.string().min(1), code: z.string() });

/** Turn a response into data or a sentence. Exported for tests; pages use the named calls below. */
export function readResponse<T>(status: number, body: unknown, schema: z.ZodType<T>): ApiResult<T> {
  if (status >= 200 && status < 300) {
    const parsed = schema.safeParse(body);
    return parsed.success ? { ok: true, data: parsed.data } : { ok: false, error: UNREADABLE, code: "failed" };
  }
  const problem = problemSchema.safeParse(body);
  return problem.success
    ? { ok: false, error: problem.data.error, code: problem.data.code }
    : { ok: false, error: UNREADABLE, code: "failed" };
}

async function request<T>(url: string, schema: z.ZodType<T>, body?: unknown): Promise<ApiResult<T>> {
  let response: Response;
  try {
    response = await fetch(url, {
      method: body === undefined ? "GET" : "POST",
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
    });
  } catch {
    return { ok: false, error: UNREACHABLE, code: "unreachable" };
  }
  const json: unknown = await response.json().catch(() => null);
  return readResponse(response.status, json, schema);
}

const capabilitiesSchema = z.object({
  reading: z.boolean(),
  negotiation: z.boolean(),
  voice: z.boolean(),
  payments: z.boolean(),
  // Older servers do not send it: no phone calls then.
  phone: z.boolean().default(false),
});

const replySchema = z.object({ reply: z.string().min(1), done: z.boolean() });

const outcomeSchema = z.object({
  outcome: z.object({
    result: z.enum(["won", "partial", "declined", "unclear"]),
    aprAfterBps: z.number().nullable(),
    annualFeeWaivedCents: z.number().nullable(),
    lateFeeRefundCents: z.number().nullable(),
    creditLimitAfterCents: z.number().nullable(),
    statementCreditCents: z.number().nullable(),
    followUp: z.string().nullable(),
    evidence: z.array(z.object({ quote: z.string(), turnIndex: z.number() })),
    verified: z.boolean(),
  }),
});

const checkoutSchema = z.object({ url: z.string().min(1) });

// callId is null when Stripe has no call on record for the session.
const paymentSchema = z.object({ paid: z.boolean(), amountCents: z.number(), callId: z.string().nullable() });

/** Which features the server's keys switch on. */
export function fetchCapabilities(): Promise<ApiResult<Capabilities>> {
  return request("/api/config", capabilitiesSchema);
}

/** The agent's next line. With no turns the server answers with the opening line. */
export function fetchAgentReply(brief: NegotiationBrief, turns: Turn[]): Promise<ApiResult<{ reply: string; done: boolean }>> {
  return request("/api/negotiate", replySchema, { brief, turns });
}

/** What the bank granted, read from the transcript and checked by code on the server. */
export function fetchOutcome(brief: NegotiationBrief, turns: Turn[]): Promise<ApiResult<{ outcome: CallOutcome }>> {
  return request("/api/outcome", outcomeSchema, { brief, turns });
}

const phoneStartSchema = z.object({ conversationId: z.string().min(1) });

const phoneStatusSchema = z.object({
  status: z.enum(["dialing", "live", "wrapping", "done", "failed"]),
  /** Why the line did not connect, in plain words. Set when the status is "failed". */
  reason: z.string().nullable(),
  turns: z.array(z.object({ role: z.enum(["agent", "bank"]), text: z.string(), at: z.number() })),
});

export type PhoneStatus = z.infer<typeof phoneStatusSchema>;

/** Ring a phone: the agent calls the number and the person who answers plays the bank. */
export function startPhoneCall(input: {
  brief: NegotiationBrief;
  toNumber: string;
  voiceId?: string;
}): Promise<ApiResult<{ conversationId: string }>> {
  return request("/api/voice/phone", phoneStartSchema, input);
}

/** Where a phone call stands, with the transcript so far. */
export function fetchPhoneStatus(conversationId: string): Promise<ApiResult<PhoneStatus>> {
  return request(`/api/voice/phone/${encodeURIComponent(conversationId)}`, phoneStatusSchema);
}

/** A Stripe Checkout page for the fee on one win. The server computes the fee itself. */
export function startCheckout(input: {
  callId: string;
  annualSavingsCents: number;
  label: string;
}): Promise<ApiResult<{ url: string }>> {
  return request("/api/checkout", checkoutSchema, input);
}

/** Whether a Checkout session was paid, asked after Stripe sends the visitor back. */
export function verifyCheckout(
  sessionId: string,
): Promise<ApiResult<{ paid: boolean; amountCents: number; callId: string | null }>> {
  return request(`/api/checkout/verify?session_id=${encodeURIComponent(sessionId)}`, paymentSchema);
}
