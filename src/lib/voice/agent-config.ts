// The body scripts/setup-agent.ts sends to ElevenLabs to create or update the agent.
// Field names follow the Agents Platform REST API (POST /v1/convai/agents/create).
import { AGENT_FIRST_MESSAGE, PINNED_RULES, agentPrompt } from "./agent-prompt";
import { MAX_CALL_MS } from "./session";
import { AGENT_TTS_MODEL, AGENT_VOICES, DEFAULT_AGENT_VOICE } from "./voices";

/** Used when ELEVENLABS_AGENT_LLM is not set. Any model id the Agents Platform lists works. */
export const DEFAULT_AGENT_LLM = "claude-haiku-5-5";

/**
 * The events the agent sends to the browser, listed on purpose and not left to the platform's default.
 * The two transcript events are what the outcome is read from. agent_tool_response is how the SDK
 * learns that the agent hung up with end_call, so the call ends as a goodbye and not as a lost line.
 */
const CLIENT_EVENTS = [
  "audio",
  "interruption",
  "user_transcript",
  "agent_response",
  "agent_response_correction",
  "agent_tool_response",
];

/**
 * The browser hangs up at five minutes. The agent's own limit comes a little later: it is the backstop
 * for a browser that does not, and the later time keeps a normal call from ending as a cut line.
 */
const AGENT_MAX_SECONDS = MAX_CALL_MS / 1000 + 15;

/** Sounds a listener makes while the agent talks. They mean "go on", not "stop". */
const INTERRUPTION_IGNORE_TERMS = ["okay", "ok", "yeah", "yep", "uh huh", "mhm", "mm", "right", "sure", "got it", "go ahead", "hmm"];

/**
 * The transfer tool for one phone call: dial the cardholder, give them a short summary, join them to
 * the bank and drop the agent. ElevenLabs does not fill dynamic variables inside a transfer destination
 * (it dialed the placeholder text), so the real number is written onto the agent before the call.
 */
export function transferToolFor(cardholderNumber: string | null) {
  return {
    type: "system",
    name: "transfer_to_number",
    description: "",
    params: {
      system_tool_type: "transfer_to_number",
      transfers: cardholderNumber
        ? [{ transfer_destination: { type: "phone", phone_number: cardholderNumber }, condition: TRANSFER_CONDITION, transfer_type: "conference" }]
        : [],
      // An update merges into the stored agent, so the other transfer format is cleared on purpose.
      transfer_rules: [],
    },
  };
}

/** When the agent may hand the call to the cardholder. The call instructions say whether it can at all. */
const TRANSFER_CONDITION =
  "The representative asks to speak with the cardholder directly, needs the cardholder to verify identity, or will not continue with an assistant, and the call instructions say the cardholder can be connected.";

export type AgentSettings = { llm: string; voiceId?: string };

export function agentConfig(settings: AgentSettings) {
  return {
    name: "Haggle negotiator",
    conversation_config: {
      agent: {
        first_message: AGENT_FIRST_MESSAGE,
        // The opening line carries the disclosures (AI assistant, recorded call). Noise must not cut it short.
        disable_first_message_interruptions: true,
        language: "en",
        prompt: {
          prompt: agentPrompt(PINNED_RULES),
          llm: settings.llm,
          // Lets the agent hang up after the goodbye. An empty description keeps ElevenLabs' default wording.
          built_in_tools: {
            end_call: { type: "system", name: "end_call", description: "", params: { system_tool_type: "end_call" } },
            // Brings the cardholder in when the bank wants them. Empty here: the phone route writes the
            // cardholder's number in right before each phone call (see transferToolFor).
            transfer_to_number: transferToolFor(null),
          },
        },
      },
      conversation: { max_duration_seconds: AGENT_MAX_SECONDS, client_events: CLIENT_EVENTS },
      // Phone lines and busy rooms are noisy. The agent waits a beat before taking its turn, and short
      // listening sounds ("okay", "mhm", "yeah") from the other side do not stop it mid-sentence.
      turn: {
        turn_eagerness: "patient",
        interruption_ignore_terms: INTERRUPTION_IGNORE_TERMS,
        merge_with_default_ignore_terms: true,
      },
      tts: {
        model_id: AGENT_TTS_MODEL,
        voice_id: settings.voiceId ?? AGENT_VOICES[DEFAULT_AGENT_VOICE].id,
        // Lets the voice carry tone (warmth, a pause, emphasis) instead of reading flat.
        expressive_mode: true,
      },
    },
    platform_settings: {
      // A private agent: a call can only start with a token minted by our server (POST /api/voice/session).
      auth: { enable_auth: true },
      // The visitor picks the agent's voice per call. Nothing else may be changed from the browser.
      // A call in Spanish also switches the agent's language (speech recognition and voice).
      overrides: { conversation_config_override: { tts: { voice_id: true }, agent: { language: true } } },
    },
  };
}

export type AgentConfig = ReturnType<typeof agentConfig>;
