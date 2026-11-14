// POST /api/voice/phone and GET /api/voice/phone/{id}: ring a phone with the agent, then follow the call.
import { allow, allowKey, ok, problem, readJson } from "@/lib/server/http";
import type { Turn } from "@/lib/types";
import { briefSchema } from "../brief-schema";
import { MAX_VARIABLES_BYTES, dynamicVariablesFor, variablesBytes } from "../dynamic-variables";
import {
  allowedNumbers,
  maskNumber,
  openPrefixes,
  prefixList,
  readConversation,
  ringPolicyFor,
  toE164,
  type ConversationRecord,
  type PhoneCallStatus,
  type RingPolicy,
} from "../phone";
import { AGENT_VOICES, SPANISH_AGENT_VOICES } from "../voices";
import { transferToolFor } from "../agent-config";
import { ElevenLabsError, getConversation, setTransferNumber, startOutboundCall } from "./elevenlabs";

type PhoneSetup = { apiKey: string; agentId: string; phoneNumberId: string; policy: RingPolicy };

function phoneSetup(): PhoneSetup | null {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const agentId = process.env.ELEVENLABS_AGENT_ID;
  const phoneNumberId = process.env.ELEVENLABS_PHONE_NUMBER_ID;
  const policy = { allowed: allowedNumbers(process.env.PHONE_ALLOWED_NUMBERS), open: openPrefixes(process.env.PHONE_OPEN_PREFIXES) };
  if (!apiKey || !agentId || !phoneNumberId || (policy.allowed.size === 0 && policy.open.length === 0)) return null;
  return { apiKey, agentId, phoneNumberId, policy };
}

/**
 * Limits on calls to visitors' own phones (numbers that are not on the approved list), so the open
 * demo cannot be used to pester anyone: each number rings at most a few times an hour, and the server
 * places at most PHONE_DAILY_CAP such calls a day. In memory, per server instance.
 */
const RINGS_PER_NUMBER_PER_HOUR = 3;
const DEFAULT_DAILY_CAP = 60;
const HOUR_MS = 60 * 60_000;
const DAY_MS = 24 * HOUR_MS;

function dailyCap(): number {
  const cap = Number(process.env.PHONE_DAILY_CAP);
  return Number.isInteger(cap) && cap > 0 ? cap : DEFAULT_DAILY_CAP;
}

/** One phone call is set up at a time: the shared agent's transfer number must not cross between calls. */
let lane: Promise<unknown> = Promise.resolve();
function oneAtATime<T>(work: () => Promise<T>): Promise<T> {
  const run = lane.then(work, work);
  lane = run.catch(() => undefined);
  return run;
}

const NOT_SET_UP = "Phone calls are not set up on this server. Use a voice or typed call instead.";
const KNOWN_VOICES = new Set<string>([...Object.values(AGENT_VOICES), ...Object.values(SPANISH_AGENT_VOICES)].map((voice) => voice.id));

export type Dial = typeof startOutboundCall;
export type SetTransfer = (apiKey: string, agentId: string, tool: unknown) => Promise<void>;
export type Lookup = typeof getConversation;

export async function handleStartPhoneCall(
  request: Request,
  dial: Dial = startOutboundCall,
  setTransfer: SetTransfer = setTransferNumber,
): Promise<Response> {
  const setup = phoneSetup();
  if (!setup) return problem("not_configured", NOT_SET_UP);

  // A phone call costs real minutes on two services. Three tries every ten minutes is plenty for a person.
  if (!allow(request, "phone", 3, 10 * 60_000)) {
    return problem("rate_limited", "Too many phone calls were started. Wait a few minutes and try again.");
  }

  const body = (await readJson(request)) as { brief?: unknown; toNumber?: unknown; voiceId?: unknown; cardholderNumber?: unknown } | null;
  const brief = briefSchema.safeParse(body?.brief);
  if (!brief.success) return problem("bad_request", "A phone call needs a valid brief.");

  const toNumber = typeof body?.toNumber === "string" ? toE164(body.toNumber) : null;
  if (!toNumber) return problem("bad_request", "Type a phone number, like (555) 234-5678.");
  const refused = (whose: string) =>
    setup.policy.open.length > 0
      ? `${whose} can't be rung from this demo. It calls numbers starting with ${prefixList(setup.policy.open)}.`
      : `${whose} is not on this server's approved list, so nobody can use it to call strangers. Use a voice or typed call instead.`;
  const toPolicy = ringPolicyFor(toNumber, setup.policy);
  if (toPolicy === "refused") return problem("bad_request", refused("That number"));
  const voiceId = typeof body?.voiceId === "string" && KNOWN_VOICES.has(body.voiceId) ? body.voiceId : undefined;

  // The number the agent may connect if the bank asks for the cardholder. Same allow list: nobody gets dialed unasked.
  const rawCardholder = typeof body?.cardholderNumber === "string" ? body.cardholderNumber.trim() : "";
  const cardholderNumber = rawCardholder === "" ? undefined : toE164(rawCardholder);
  if (cardholderNumber === null) return problem("bad_request", "Type the cardholder's phone number, like (555) 234-5678.");
  const cardholderPolicy = cardholderNumber ? ringPolicyFor(cardholderNumber, setup.policy) : null;
  if (cardholderPolicy === "refused") return problem("bad_request", refused("The cardholder's number"));
  if (cardholderNumber && cardholderNumber === toNumber) {
    return problem("bad_request", "The cardholder needs a different phone from the one playing the bank.");
  }

  // Visitors' own phones: a few rings per number per hour, and a daily budget for the whole server.
  const visitorNumbers = [toPolicy === "open" ? toNumber : null, cardholderPolicy === "open" ? cardholderNumber : null].filter(
    (number): number is string => Boolean(number),
  );
  if (visitorNumbers.length > 0) {
    if (!visitorNumbers.every((number) => allowKey(`phone-number:${number}`, RINGS_PER_NUMBER_PER_HOUR, HOUR_MS))) {
      return problem("rate_limited", "That phone was rung a few times already this hour. Try again later, or type the call instead.");
    }
    if (!allowKey("phone-daily", dailyCap(), DAY_MS)) {
      return problem("rate_limited", "Today's demo phone calls are used up. Type the call instead, it works the same way.");
    }
  }

  const dynamicVariables = dynamicVariablesFor(brief.data, { cardholderPhone: cardholderNumber });
  if (variablesBytes(dynamicVariables) > MAX_VARIABLES_BYTES) {
    return problem("too_large", "This call has too much detail for a phone call. Type the call instead.");
  }

  try {
    // One agent serves every call, so this call's cardholder (or nobody) is written onto it just before
    // dialing. Two phone calls started in the same second could cross; the allow list keeps that among
    // the owner's own approved phones.
    const { conversationId } = await oneAtATime(async () => {
      await setTransfer(setup.apiKey, setup.agentId, transferToolFor(cardholderNumber ?? null));
      return dial(setup.apiKey, {
        agentId: setup.agentId,
        phoneNumberId: setup.phoneNumberId,
        toNumber,
        dynamicVariables,
        voiceId,
        language: brief.data.language,
      });
    });
    console.info(`[phone] ringing ${maskNumber(toNumber)}, conversation ${conversationId}`);
    return ok({ conversationId });
  } catch (error) {
    console.error("[phone] could not place the call:", error instanceof Error ? error.message : error);
    const setupMistake = error instanceof ElevenLabsError && [401, 403, 404, 422].includes(error.status);
    return setupMistake
      ? problem("not_configured", "The phone service refused this server's setup, so the call was not placed.")
      : problem("failed", "The phone service did not place the call. Try again in a moment.");
  }
}

export type PhoneStatusBody = { status: PhoneCallStatus; reason: string | null; turns: Turn[]; transferred: boolean };

const CONVERSATION_ID = /^[A-Za-z0-9_-]{6,80}$/;

export async function handlePhoneStatus(request: Request, conversationId: string, lookup: Lookup = getConversation): Promise<Response> {
  const setup = phoneSetup();
  if (!setup) return problem("not_configured", NOT_SET_UP);
  if (!CONVERSATION_ID.test(conversationId)) return problem("bad_request", "That is not a call id.");
  // The page asks every two seconds, for a few minutes at most.
  if (!allow(request, "phone-status", 300, 10 * 60_000)) {
    return problem("rate_limited", "Too many status checks. Wait a moment.");
  }

  try {
    const record = (await lookup(setup.apiKey, conversationId)) as ConversationRecord;
    // Only calls made by this server's agent: the API key can read every conversation on the account.
    if (record.agent_id && record.agent_id !== setup.agentId) return problem("bad_request", "That is not a call id.");
    return ok<PhoneStatusBody>(readConversation(record));
  } catch (error) {
    if (error instanceof ElevenLabsError && error.status === 404) {
      // Right after the call is placed the record can take a moment to appear.
      return ok<PhoneStatusBody>({ status: "dialing", reason: null, turns: [], transferred: false });
    }
    console.error("[phone] could not read the call:", error instanceof Error ? error.message : error);
    return problem("failed", "We could not check on the call. Trying again.");
  }
}
