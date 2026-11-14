// What POST /api/voice/session answers, and the browser's call to it.
// The server keeps the ElevenLabs key. The browser gets a short-lived token for one call and the
// dynamic variables to hand to the agent when it connects.
import { z } from "zod";
import type { NegotiationBrief } from "@/lib/types";
import { VOICE_PROBLEM } from "./problems";

/** A call ends after five minutes: the browser hangs up, and the agent has its own limit as a backstop. */
export const MAX_CALL_MS = 5 * 60_000;

export const voiceSessionSchema = z.discriminatedUnion("configured", [
  // The server has no ElevenLabs key or no agent id: the page offers typing instead.
  z.object({ configured: z.literal(false) }),
  z.object({
    configured: z.literal(true),
    /** Lets the SDK join one WebRTC call with our private agent. Not the API key. */
    conversationToken: z.string().min(1),
    dynamicVariables: z.record(z.string(), z.string()),
  }),
]);

export type VoiceSession = z.infer<typeof voiceSessionSchema>;

const problemSchema = z.object({ error: z.string().min(1) });

export type VoiceSessionResult = { ok: true; session: VoiceSession } | { ok: false; error: string };

/** Ask our server for a voice session. A failure comes back as one sentence for the visitor. */
export async function requestVoiceSession(brief: NegotiationBrief): Promise<VoiceSessionResult> {
  let response: Response;
  try {
    response = await fetch("/api/voice/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brief }),
      cache: "no-store",
    });
  } catch {
    return { ok: false, error: VOICE_PROBLEM.unreachable };
  }
  return readVoiceSession(response.ok, await response.json().catch(() => null));
}

/** Check the server's answer. Our routes report every failure as `{ error, code }`. */
export function readVoiceSession(ok: boolean, body: unknown): VoiceSessionResult {
  if (ok) {
    const session = voiceSessionSchema.safeParse(body);
    if (session.success) return { ok: true, session: session.data };
  }
  const problem = problemSchema.safeParse(body);
  return { ok: false, error: problem.success ? problem.data.error : VOICE_PROBLEM.couldNotConnect };
}
