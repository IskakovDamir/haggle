// The three ElevenLabs REST calls Haggle makes. Server only: every call carries the API key.
//
//   GET   /v1/convai/conversation/token?agent_id=   a token for one WebRTC call with a private agent
//   POST  /v1/convai/agents/create                  create the agent (scripts/setup-agent.ts)
//   PATCH /v1/convai/agents/{agent_id}              update it
import type { AgentConfig } from "../agent-config";

const API_ORIGIN = "https://api.elevenlabs.io";
const TIMEOUT_MS = 15_000;

export type Fetch = typeof fetch;

/** ElevenLabs answered with an error status. `detail` is its own explanation, for logs and the setup script. */
export class ElevenLabsError extends Error {
  constructor(
    readonly status: number,
    readonly detail: string,
  ) {
    super(`ElevenLabs answered ${status}: ${detail}`);
    this.name = "ElevenLabsError";
  }
}

/** Errors come as { detail: { message } }, { detail: "..." } or a list of validation issues. */
function describeError(body: unknown): string {
  const detail = body && typeof body === "object" && "detail" in body ? body.detail : body;
  if (typeof detail === "string") return detail;
  if (detail && typeof detail === "object" && "message" in detail && typeof detail.message === "string") return detail.message;
  return JSON.stringify(detail ?? "no details").slice(0, 600);
}

async function call(apiKey: string, path: string, init: { method: string; body?: unknown }, fetcher: Fetch): Promise<unknown> {
  const response = await fetcher(`${API_ORIGIN}${path}`, {
    method: init.method,
    headers: { "xi-api-key": apiKey, ...(init.body === undefined ? {} : { "Content-Type": "application/json" }) },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    cache: "no-store",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) throw new ElevenLabsError(response.status, describeError(body));
  return body;
}

/** A string field of a JSON answer, or an error that names what was missing. */
function field(body: unknown, name: string): string {
  const value = body && typeof body === "object" ? (body as Record<string, unknown>)[name] : undefined;
  if (typeof value !== "string" || value === "") throw new Error(`ElevenLabs sent no "${name}".`);
  return value;
}

/** A short-lived token that lets one browser join one call with the agent. */
export async function mintConversationToken(access: { apiKey: string; agentId: string }, fetcher: Fetch = fetch): Promise<string> {
  const path = `/v1/convai/conversation/token?agent_id=${encodeURIComponent(access.agentId)}`;
  return field(await call(access.apiKey, path, { method: "GET" }, fetcher), "token");
}

/** A short-lived token that lets one browser stream its microphone to realtime speech to text (the live coach). */
export async function mintScribeToken(apiKey: string, fetcher: Fetch = fetch): Promise<string> {
  return field(await call(apiKey, "/v1/single-use-token/realtime_scribe", { method: "POST" }, fetcher), "token");
}

/** Create the agent and return its id. */
export async function createAgent(apiKey: string, config: AgentConfig, fetcher: Fetch = fetch): Promise<string> {
  return field(await call(apiKey, "/v1/convai/agents/create", { method: "POST", body: config }, fetcher), "agent_id");
}

/** Update an existing agent in place and return its id. */
export async function updateAgent(apiKey: string, agentId: string, config: AgentConfig, fetcher: Fetch = fetch): Promise<string> {
  const path = `/v1/convai/agents/${encodeURIComponent(agentId)}`;
  return field(await call(apiKey, path, { method: "PATCH", body: config }, fetcher), "agent_id");
}

// ---- phone calls (a Twilio number connected to ElevenLabs) --------------------------------------
//
//   POST /v1/convai/phone-numbers                  import a Twilio number (scripts/setup-phone.ts)
//   POST /v1/convai/twilio/outbound-call           ring a number with the agent
//   GET  /v1/convai/conversations/{id}             the call's status and transcript

/** Connect a Twilio number to ElevenLabs and return its phone number id. */
export async function importTwilioNumber(
  apiKey: string,
  number: { label: string; phoneNumber: string; sid: string; token: string },
  fetcher: Fetch = fetch,
): Promise<string> {
  const body = { provider: "twilio", label: number.label, phone_number: number.phoneNumber, sid: number.sid, token: number.token };
  return field(await call(apiKey, "/v1/convai/phone-numbers", { method: "POST", body }, fetcher), "phone_number_id");
}

/** Ring one number. The agent's call instructions arrive as dynamic variables, exactly as on a browser call. */
export async function startOutboundCall(
  apiKey: string,
  input: {
    agentId: string;
    phoneNumberId: string;
    toNumber: string;
    dynamicVariables: Record<string, string>;
    voiceId?: string;
    language?: "en" | "es";
  },
  fetcher: Fetch = fetch,
): Promise<{ conversationId: string }> {
  const body = {
    agent_id: input.agentId,
    agent_phone_number_id: input.phoneNumberId,
    to_number: input.toNumber,
    conversation_initiation_client_data: {
      dynamic_variables: input.dynamicVariables,
      ...(input.voiceId || input.language === "es"
        ? {
            conversation_config_override: {
              ...(input.voiceId ? { tts: { voice_id: input.voiceId } } : {}),
              ...(input.language === "es" ? { agent: { language: "es" } } : {}),
            },
          }
        : {}),
    },
  };
  const answer = await call(apiKey, "/v1/convai/twilio/outbound-call", { method: "POST", body }, fetcher);
  const placed = answer !== null && typeof answer === "object" && (answer as { success?: unknown }).success === true;
  if (!placed) {
    const message = answer !== null && typeof answer === "object" ? (answer as { message?: unknown }).message : null;
    throw new ElevenLabsError(502, typeof message === "string" ? message : "The call was not placed.");
  }
  return { conversationId: field(answer, "conversation_id") };
}

/** Point the agent's transfer tool at one cardholder's phone, or at nobody. Other settings are left as they are. */
export async function setTransferNumber(
  apiKey: string,
  agentId: string,
  tool: unknown,
  fetcher: Fetch = fetch,
): Promise<void> {
  const body = { conversation_config: { agent: { prompt: { built_in_tools: { transfer_to_number: tool } } } } };
  await call(apiKey, `/v1/convai/agents/${encodeURIComponent(agentId)}`, { method: "PATCH", body }, fetcher);
}

/** The raw conversation record: status, transcript and call metadata. */
export async function getConversation(apiKey: string, conversationId: string, fetcher: Fetch = fetch): Promise<unknown> {
  return call(apiKey, `/v1/convai/conversations/${encodeURIComponent(conversationId)}`, { method: "GET" }, fetcher);
}
