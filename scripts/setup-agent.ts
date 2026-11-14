// Creates the ElevenLabs agent behind Haggle's voice calls, or updates it when ELEVENLABS_AGENT_ID is set.
//
//   pnpm setup:agent            create or update (reads ELEVENLABS_API_KEY from .env.local)
//   pnpm setup:agent --dry-run  print the request and call nothing
//
// Optional: ELEVENLABS_AGENT_LLM (the agent's model) and ELEVENLABS_VOICE_ID (its voice).
// The agent is private and its prompt is the same for every call. See src/lib/voice/agent-prompt.ts.
import { DEFAULT_AGENT_LLM, agentConfig } from "@/lib/voice/agent-config";
import { ElevenLabsError, createAgent, updateAgent } from "@/lib/voice/server/elevenlabs";

async function main(): Promise<void> {
  const config = agentConfig({
    llm: process.env.ELEVENLABS_AGENT_LLM || DEFAULT_AGENT_LLM,
    voiceId: process.env.ELEVENLABS_VOICE_ID || undefined,
  });

  if (process.argv.includes("--dry-run")) {
    console.log(JSON.stringify(config, null, 2));
    return;
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    console.error("ELEVENLABS_API_KEY is not set. Add it to .env.local, then run `pnpm setup:agent` again.");
    process.exitCode = 1;
    return;
  }

  const existingId = process.env.ELEVENLABS_AGENT_ID;
  try {
    const agentId = existingId ? await updateAgent(apiKey, existingId, config) : await createAgent(apiKey, config);
    console.log(`${existingId ? "Updated" : "Created"} the agent "${config.name}" (model: ${config.conversation_config.agent.prompt.llm}).`);
    console.log(`Agent id: ${agentId}`);
    if (existingId) {
      console.log("ELEVENLABS_AGENT_ID in .env.local is already right. Nothing to change.");
    } else {
      console.log("\nAdd this line to .env.local, and to the host's environment variables, then restart the server:\n");
      console.log(`ELEVENLABS_AGENT_ID=${agentId}`);
    }
  } catch (error) {
    const reason = error instanceof ElevenLabsError ? `${error.status} ${error.detail}` : error instanceof Error ? error.message : String(error);
    console.error(`ElevenLabs did not ${existingId ? "update" : "create"} the agent: ${reason}`);
    if (error instanceof ElevenLabsError && error.status === 401) console.error("Check ELEVENLABS_API_KEY in .env.local.");
    if (error instanceof ElevenLabsError && error.status === 404) console.error("Check ELEVENLABS_AGENT_ID in .env.local, or remove it to create a new agent.");
    process.exitCode = 1;
  }
}

void main();
