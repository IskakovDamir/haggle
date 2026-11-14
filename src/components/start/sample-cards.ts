// A card read from one of our sample statements keeps that fact in its id ("sample-maria-chase").
// The case file has no other place for it, and later screens need it to show the "Sample data" badge.
// It also means opening the same sample twice updates one card instead of adding a copy.
import type { CardAccount } from "@/lib/types";

const PREFIX = "sample-";

export function sampleCardId(sampleId: string): string {
  return `${PREFIX}${sampleId}`;
}

export function isSampleCard(card: Pick<CardAccount, "id">): boolean {
  return card.id.startsWith(PREFIX);
}
