// CONTRACT STUB. The negotiator owner replaces the bodies (and may split into files) but keeps these
// exports and signatures. See SPEC.md, "Negotiator".
import type { CallOutcome, CardAccount, Lever, NegotiationBrief, Turn } from "@/lib/types";

const todo = (name: string): never => {
  throw new Error(`negotiator.${name} is not implemented yet`);
};

/** Everything the agent may know and say on one call. Deterministic: no model involved. */
export function buildBrief(input: { card: CardAccount; holderFirstName: string; lever: Lever }): NegotiationBrief {
  void input;
  return todo("buildBrief");
}

/** The agent's instructions. The same text drives the text route and the voice agent. */
export function systemPrompt(brief: NegotiationBrief): string {
  void brief;
  return todo("systemPrompt");
}

/** The agent's first line, with the disclosures. Deterministic. */
export function openingLine(brief: NegotiationBrief): string {
  void brief;
  return todo("openingLine");
}

/** Code check on a model-read outcome: every granted number must appear in a bank turn. */
export function verifyOutcome(draft: Omit<CallOutcome, "verified">, turns: Turn[]): CallOutcome {
  void draft;
  void turns;
  return todo("verifyOutcome");
}
