// pnpm voice-previews: writes public/voices/<voice>.mp3, the clip a visitor hears when picking the
// agent's voice. Generated once with the same voice and model the agent uses, then served as static
// files, so picking a voice never calls ElevenLabs. Needs ELEVENLABS_API_KEY in .env.local.
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  AGENT_TTS_MODEL,
  AGENT_VOICES,
  SPANISH_AGENT_VOICES,
  VOICE_PREVIEW_LINE,
  VOICE_PREVIEW_LINE_ES,
  voicePreviewPathFor,
  type AgentVoice,
} from "../src/lib/voice/voices";

async function main() {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) throw new Error("ELEVENLABS_API_KEY is not set in .env.local.");
  mkdirSync(join("public", "voices"), { recursive: true });

  const clips = (["en", "es"] as const).flatMap((language) =>
    (Object.keys(AGENT_VOICES) as AgentVoice[]).map((voice) => ({
      voice,
      language,
      ...(language === "es" ? SPANISH_AGENT_VOICES[voice] : AGENT_VOICES[voice]),
      text: language === "es" ? VOICE_PREVIEW_LINE_ES : VOICE_PREVIEW_LINE,
    })),
  );
  for (const { voice, language, id, name, text } of clips) {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${id}?output_format=mp3_44100_64`, {
      method: "POST",
      headers: { "xi-api-key": apiKey, "content-type": "application/json" },
      body: JSON.stringify({ text, model_id: AGENT_TTS_MODEL, ...(language === "es" ? { language_code: "es" } : {}) }),
    });
    if (!response.ok) throw new Error(`${name}: ElevenLabs answered ${response.status}: ${(await response.text()).slice(0, 200)}`);
    const bytes = new Uint8Array(await response.arrayBuffer());
    const file = join("public", voicePreviewPathFor(voice, language));
    writeFileSync(file, bytes);
    console.log(`${name}: wrote ${file} (${Math.round(bytes.length / 1024)} KB)`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
