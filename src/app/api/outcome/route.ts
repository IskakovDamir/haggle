import { handleOutcome } from "@/lib/negotiator/server/outcome";

// Reading a whole transcript may take up to the 45 s model timeout.
export const maxDuration = 60;

// POST { brief, turns }: { outcome }, what the bank granted on a finished call.
// A model reads the transcript; code then keeps only the numbers the bank said itself.
// When a number fails that check the result is "unclear" and `verified` is false.
export function POST(request: Request) {
  return handleOutcome(request);
}
