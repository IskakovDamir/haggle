// POST /api/voice/session: what the browser needs to start one voice call.
import { allow, ok, problem, readJson } from "@/lib/server/http";
import { briefSchema } from "../brief-schema";
import { MAX_VARIABLES_BYTES, dynamicVariablesFor, variablesBytes, type DynamicVariables } from "../dynamic-variables";
import type { VoiceSession } from "../session";
import { ElevenLabsError, mintConversationToken } from "./elevenlabs";

export type MintToken = (access: { apiKey: string; agentId: string }) => Promise<string>;

export async function handleVoiceSession(request: Request, mint: MintToken = mintConversationToken): Promise<Response> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const agentId = process.env.ELEVENLABS_AGENT_ID;
  if (!apiKey || !agentId) return ok<VoiceSession>({ configured: false });

  if (!allow(request, "voice", 6, 60_000)) {
    return problem("rate_limited", "Too many voice calls were started. Wait a minute and try again, or type the call instead.");
  }

  const brief = briefSchema.safeParse((await readJson(request)).brief);
  if (!brief.success) {
    const where = ["brief", ...brief.error.issues[0].path].join(".");
    return problem("bad_request", `A voice call needs a valid brief. Check "${where}".`);
  }

  let dynamicVariables: DynamicVariables;
  try {
    dynamicVariables = dynamicVariablesFor(brief.data);
  } catch (error) {
    console.error("[voice] could not write the call instructions:", error instanceof Error ? error.message : error);
    return problem("failed", "We could not prepare the voice call. Type the call instead.");
  }
  if (variablesBytes(dynamicVariables) > MAX_VARIABLES_BYTES) {
    return problem("too_large", "This call has too much detail for a voice call. Type the call instead.");
  }

  try {
    const conversationToken = await mint({ apiKey, agentId });
    return ok<VoiceSession>({ configured: true, conversationToken, dynamicVariables });
  } catch (error) {
    console.error("[voice] could not mint a conversation token:", error instanceof Error ? error.message : error);
    // A refused key or an unknown agent is a setup mistake on our side, not something to retry.
    const setupMistake = error instanceof ElevenLabsError && [401, 403, 404].includes(error.status);
    return setupMistake
      ? problem("not_configured", "Voice calls are switched off because the voice service refused this server's setup. Type the call instead.")
      : problem("failed", "The voice service did not answer. Try again, or type the call instead.");
  }
}
