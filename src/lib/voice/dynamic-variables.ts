// The per-call values for the agent's two dynamic variables. Pure: the brief goes in, text comes out.
// Both texts come from the negotiator, so the voice agent and the typed call follow the same words.
import { openingLine, systemPrompt } from "@/lib/negotiator";
import type { NegotiationBrief } from "@/lib/types";
import { CALL_INSTRUCTIONS, OPENING_LINE } from "./agent-prompt";

export type DynamicVariables = Record<string, string>;

/**
 * The SDK sends the variables to the agent in one WebRTC data message, and LiveKit caps a reliable
 * message at 15 KiB. This budget leaves room for the rest of that message.
 */
export const MAX_VARIABLES_BYTES = 12_000;

export function dynamicVariablesFor(brief: NegotiationBrief): DynamicVariables {
  return {
    [CALL_INSTRUCTIONS]: systemPrompt(brief),
    [OPENING_LINE]: openingLine(brief),
  };
}

/** The size of the variables as they travel: UTF-8 bytes of their JSON. */
export function variablesBytes(variables: DynamicVariables): number {
  return new TextEncoder().encode(JSON.stringify(variables)).length;
}
