// From the SDK's events to our own words: a spoken message becomes a Turn, a disconnection becomes
// the reason the call ended. Pure, so the hook stays thin and this part is tested.
import type { Turn } from "@/lib/types";

/** The part of the SDK's onMessage payload we read. "user" is whoever is at the microphone. */
export type SpokenMessage = { role: "user" | "agent"; message: string };

/** The part of the SDK's onDisconnect details we read. */
export type Disconnection = { reason: "user" | "agent" | "error"; context?: { type?: string } };

export type EndReason = "user" | "agent" | "error";

/** At least one character that is not space or punctuation. Speech-to-text reports noise as "...". */
const HAS_WORDS = /[^\s.…,;:!?'"-]/;

/**
 * One finished utterance as a Turn. The human at the microphone plays the bank; the agent is ours.
 * Returns null when nothing was said. `at` is milliseconds since the call started.
 */
export function turnFromMessage(message: SpokenMessage, at: number): Turn | null {
  const text = message.message.replace(/\s+/g, " ").trim();
  if (!HAS_WORDS.test(text)) return null;
  return { role: message.role === "user" ? "bank" : "agent", text, at: Math.max(0, Math.round(at)) };
}

/**
 * Why the call ended, given how many turns were heard before it did.
 *
 * The SDK reports the five-minute limit as an error, but for the visitor it is a normal end: the
 * transcript is complete and the outcome can be read. The opposite case is the agent's side closing
 * a call in which nobody said a word: that is a call that failed to start, not a goodbye.
 */
export function endReasonFrom(details: Disconnection, turnsHeard: number): EndReason {
  if (details.reason === "error" && details.context?.type === "max_duration_exceeded") return "agent";
  if (details.reason === "agent" && turnsHeard === 0) return "error";
  return details.reason;
}
