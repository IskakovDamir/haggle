import { handleNegotiate } from "@/lib/negotiator/server/negotiate";

// One spoken turn is quick, but the model call may take up to its 45 s timeout.
export const maxDuration = 60;

// POST { brief, turns }: { reply, done }, the agent's next line in a typed call.
// With no turns the reply is the fixed opening line and no model is called.
// Limits: 40 turns, 1,000 characters per turn, 60 requests a minute per visitor.
export function POST(request: Request) {
  return handleNegotiate(request);
}
