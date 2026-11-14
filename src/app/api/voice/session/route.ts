import { handleVoiceSession } from "@/lib/voice/server/session";

// POST { brief }: { configured: false } when the server has no ElevenLabs key or agent id, otherwise
// { configured: true, conversationToken, dynamicVariables } for one call. The API key stays here.
// Limit: 6 calls a minute per visitor. Each call ends after five minutes.
export function POST(request: Request) {
  return handleVoiceSession(request);
}
