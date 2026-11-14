import { handleShare } from "@/lib/share/server";

// POST { bank, card, outcome, turns, sample }: { url, token }, a signed link to a win card.
// The server re-checks the outcome against the transcript and recomputes savings before signing.
export function POST(request: Request) {
  return handleShare(request);
}
