// pnpm voice-previews: writes public/voices/<voice>.mp3, the clip a visitor hears when picking the
// agent's voice. Generated once with the same voice and model the agent uses, then served as static
// files, so picking a voice never calls ElevenLabs. Needs ELEVENLABS_API_KEY in .env.local.
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { AGENT_TTS_MODEL, AGENT_VOICES, VOICE_PREVIEW_LINE, voicePreviewPath, type AgentVoice } from "../src/lib/voice/voices";

async function main() {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) throw new Error("ELEVENLABS_API_KEY is not set in .env.local.");
  mkdirSync(join("public", "voices"), { recursive: true });

  for (const voice of Object.keys(AGENT_VOICES) as AgentVoice[]) {
    const { id, name } = AGENT_VOICES[voice];
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${id}?output_format=mp3_44100_64`, {
      method: "POST",
      headers: { "xi-api-key": apiKey, "content-type": "application/json" },
      body: JSON.stringify({ text: VOICE_PREVIEW_LINE, model_id: AGENT_TTS_MODEL }),
    });
    if (!response.ok) throw new Error(`${name}: ElevenLabs answered ${response.status}: ${(await response.text()).slice(0, 200)}`);
    const bytes = new Uint8Array(await response.arrayBuffer());
    const file = join("public", voicePreviewPath(voice));
    writeFileSync(file, bytes);
    console.log(`${name}: wrote ${file} (${Math.round(bytes.length / 1024)} KB)`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
