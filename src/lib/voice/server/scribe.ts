// POST /api/voice/scribe: a one-time token for the live coach's speech to text. The API key stays here.
import { allow, ok, problem } from "@/lib/server/http";
import { ElevenLabsError, mintScribeToken } from "./elevenlabs";

export type ScribeSession = { configured: false } | { configured: true; token: string };

export async function handleScribeToken(request: Request, mint: (apiKey: string) => Promise<string> = mintScribeToken): Promise<Response> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) return ok<ScribeSession>({ configured: false });

  if (!allow(request, "scribe", 6, 60_000)) {
    return problem("rate_limited", "The coach was started too many times. Wait a minute and try again.");
  }
  try {
    return ok<ScribeSession>({ configured: true, token: await mint(apiKey) });
  } catch (error) {
    console.error("[scribe] could not mint a token:", error instanceof Error ? error.message : error);
    const setupMistake = error instanceof ElevenLabsError && [401, 403].includes(error.status);
    return setupMistake
      ? problem("not_configured", "The live coach is switched off because the speech service refused this server's key.")
      : problem("failed", "The speech service did not answer. Try again.");
  }
}
