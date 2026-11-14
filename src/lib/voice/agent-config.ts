// The body scripts/setup-agent.ts sends to ElevenLabs to create or update the agent.
// Field names follow the Agents Platform REST API (POST /v1/convai/agents/create).
import { AGENT_FIRST_MESSAGE, PINNED_RULES, agentPrompt } from "./agent-prompt";
import { MAX_CALL_MS } from "./session";

/** Used when ELEVENLABS_AGENT_LLM is not set. Any model id the Agents Platform lists works. */
export const DEFAULT_AGENT_LLM = "claude-sonnet-5-5";

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

export type AgentSettings = { llm: string; voiceId?: string };

export function agentConfig(settings: AgentSettings) {
  return {
    name: "Haggle negotiator",
    conversation_config: {
      agent: {
        first_message: AGENT_FIRST_MESSAGE,
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
      ...(settings.voiceId ? { tts: { voice_id: settings.voiceId } } : {}),
    },
    // A private agent: a call can only start with a token minted by our server (POST /api/voice/session).
    platform_settings: { auth: { enable_auth: true } },
  };
}

export type AgentConfig = ReturnType<typeof agentConfig>;
