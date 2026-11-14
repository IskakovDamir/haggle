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
      overrides: { conversation_config_override: { tts: { voice_id: true } } },
    },
  };
}

export type AgentConfig = ReturnType<typeof agentConfig>;
