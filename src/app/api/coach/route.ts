import { handleCoach } from "@/lib/negotiator/server/coach";

export const maxDuration = 60;

// POST { brief, earlier, heard }: { tip }, what the cardholder could say next on their own call.
// `heard` is what the browser's microphone transcribed. Offers in the tip are checked against it.
// Limit: 40 requests a minute per visitor.
export function POST(request: Request) {
  return handleCoach(request);
}
