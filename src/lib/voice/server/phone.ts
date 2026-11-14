// POST /api/voice/phone and GET /api/voice/phone/{id}: ring a phone with the agent, then follow the call.
import { allow, ok, problem, readJson } from "@/lib/server/http";
import type { Turn } from "@/lib/types";
import { briefSchema } from "../brief-schema";
import { MAX_VARIABLES_BYTES, dynamicVariablesFor, variablesBytes } from "../dynamic-variables";
import { allowedNumbers, maskNumber, readConversation, toE164, type ConversationRecord, type PhoneCallStatus } from "../phone";
import { AGENT_VOICES, SPANISH_AGENT_VOICES } from "../voices";
import { transferToolFor } from "../agent-config";
import { ElevenLabsError, getConversation, setTransferNumber, startOutboundCall } from "./elevenlabs";

type PhoneSetup = { apiKey: string; agentId: string; phoneNumberId: string; allowed: Set<string> };

function phoneSetup(): PhoneSetup | null {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const agentId = process.env.ELEVENLABS_AGENT_ID;
  const phoneNumberId = process.env.ELEVENLABS_PHONE_NUMBER_ID;
  const allowed = allowedNumbers(process.env.PHONE_ALLOWED_NUMBERS);
  if (!apiKey || !agentId || !phoneNumberId || allowed.size === 0) return null;
  return { apiKey, agentId, phoneNumberId, allowed };
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
  if (!setup.allowed.has(toNumber)) {
    return problem(
      "bad_request",
      "This server only rings numbers its owner has approved, so nobody can use it to call strangers. Use a voice or typed call instead.",
    );
  }
  const voiceId = typeof body?.voiceId === "string" && KNOWN_VOICES.has(body.voiceId) ? body.voiceId : undefined;

  // The number the agent may connect if the bank asks for the cardholder. Same allow list: nobody gets dialed unasked.
  const rawCardholder = typeof body?.cardholderNumber === "string" ? body.cardholderNumber.trim() : "";
  const cardholderNumber = rawCardholder === "" ? undefined : toE164(rawCardholder);
  if (cardholderNumber === null) return problem("bad_request", "Type the cardholder's phone number, like (555) 234-5678.");
  if (cardholderNumber && !setup.allowed.has(cardholderNumber)) {
    return problem("bad_request", "The cardholder's number is not on this server's approved list, so the agent cannot connect it.");
  }
  if (cardholderNumber && cardholderNumber === toNumber) {
    return problem("bad_request", "The cardholder needs a different phone from the one playing the bank.");
  }

  const dynamicVariables = dynamicVariablesFor(brief.data, { cardholderPhone: cardholderNumber });
  if (variablesBytes(dynamicVariables) > MAX_VARIABLES_BYTES) {
    return problem("too_large", "This call has too much detail for a phone call. Type the call instead.");
  }

  try {
    // One agent serves every call, so this call's cardholder (or nobody) is written onto it just before
    // dialing. Two phone calls started in the same second could cross; the allow list keeps that among
    // the owner's own approved phones.
    await setTransfer(setup.apiKey, setup.agentId, transferToolFor(cardholderNumber ?? null));
    const { conversationId } = await dial(setup.apiKey, {
      agentId: setup.agentId,
      phoneNumberId: setup.phoneNumberId,
      toNumber,
      dynamicVariables,
      voiceId,
      language: brief.data.language,
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
