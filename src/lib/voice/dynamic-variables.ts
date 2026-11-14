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

/**
 * `cardholderPhone` is set on a phone call when the visitor gave their own number: the agent may then
 * connect them to the bank. Without it the agent says the cardholder will call back instead.
 */
export function dynamicVariablesFor(brief: NegotiationBrief, options: { cardholderPhone?: string } = {}): DynamicVariables {
  return {
    [CALL_INSTRUCTIONS]: `${systemPrompt(brief)}

${connectSection(brief.holderFirstName, Boolean(options.cardholderPhone))}`,
    [OPENING_LINE]: openingLine(brief),
  };
}

/** What the agent does when the bank wants the cardholder. */
function connectSection(holder: string, canConnect: boolean): string {
  if (!canConnect) {
    return `CONNECTING THE CARDHOLDER
${holder} cannot be connected to this call. If the representative insists on speaking with ${holder} or on verifying identity, say ${holder} will call the bank back directly, thank them, and end the call politely.`;
  }
  return `CONNECTING THE CARDHOLDER
${holder} can be connected to this call. If the representative asks to speak with ${holder}, needs ${holder} to verify identity, or will not continue with an assistant, do not argue: say you will connect ${holder} now and ask them to hold for a moment, then use the transfer_to_number tool. For the message ${holder} hears before joining, give one or two sentences: which bank is on the line, what was asked for, and what the bank has offered so far. Do not transfer for any other reason, and never transfer before the representative asks for ${holder}.`;
}

/** The size of the variables as they travel: UTF-8 bytes of their JSON. */
export function variablesBytes(variables: DynamicVariables): number {
  return new TextEncoder().encode(JSON.stringify(variables)).length;
}
