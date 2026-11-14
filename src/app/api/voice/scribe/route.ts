import { handleScribeToken } from "@/lib/voice/server/scribe";

// POST: { configured: false } without an ElevenLabs key, otherwise { configured: true, token }, a
// single-use token for realtime speech to text in the browser. Limit: 6 a minute per visitor.
export function POST(request: Request) {
  return handleScribeToken(request);
}
