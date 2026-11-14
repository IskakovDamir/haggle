// Reading a share token on the server, for the /w page and its images.
import { siteUrl } from "@/lib/benchmarks/site";
import type { SharePayload } from "./payload";
import { cardStatus, readToken, type CardStatus } from "./sign";

export type SharedCard = { payload: SharePayload; status: CardStatus; domain: string };

/** The card behind a token, or null when the token cannot be read. A bad signature reads as "unverified". */
export async function sharedCard(token: string): Promise<SharedCard | null> {
  const read = await readToken(token);
  if (!read) return null;
  return { payload: read.payload, status: cardStatus(read), domain: new URL(siteUrl()).host };
}
