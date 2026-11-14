import type { Turn } from "@/lib/types";

/**
 * The call so far as text for the model: one JSON object per line. JSON keeps each turn inside its
 * own quotes, so nothing the bank side types can pose as another speaker or as a part of the prompt.
 */
export function transcriptLines(turns: Turn[]): string {
  return turns.map((turn, index) => JSON.stringify({ index, speaker: turn.role, text: turn.text })).join("\n");
}
