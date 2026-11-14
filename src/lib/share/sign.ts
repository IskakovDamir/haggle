// Signs share links with HMAC-SHA256 (Web Crypto), so nobody can hand-edit a "verified" card.
// SHARE_SECRET is optional: without it links are unsigned and every card says "Unverified". Nothing crashes.
import { decodePayload, encodePayload, fromBase64Url, toBase64Url, type SharePayload } from "./payload";

export type CardStatus = "verified" | "practice" | "unverified";

async function key(secret: string, usage: "sign" | "verify"): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [usage]);
}

/** "<payload>.<signature>", or just "<payload>" when there is no secret to sign with. */
export async function signPayload(payload: SharePayload, secret: string | undefined = process.env.SHARE_SECRET): Promise<string> {
  const body = encodePayload(payload);
  if (!secret) return body;
  const sig = await crypto.subtle.sign("HMAC", await key(secret, "sign"), new TextEncoder().encode(body));
  return `${body}.${toBase64Url(new Uint8Array(sig))}`;
}

/** The payload and whether its signature checks out. null when the token cannot be read at all. */
export async function readToken(
  token: string,
  secret: string | undefined = process.env.SHARE_SECRET,
): Promise<{ payload: SharePayload; signed: boolean } | null> {
  const [body, sig, extra] = decodeURIComponent(token).split(".");
  if (extra !== undefined || !body) return null;
  const payload = decodePayload(body);
  if (!payload) return null;
  if (!secret || !sig) return { payload, signed: false };
  const sigBytes = fromBase64Url(sig);
  if (!sigBytes) return { payload, signed: false };
  // crypto.subtle.verify compares in constant time.
  const signed = await crypto.subtle.verify("HMAC", await key(secret, "verify"), sigBytes as BufferSource, new TextEncoder().encode(body));
  return { payload, signed };
}

/** What the card footer says. An unsigned or tampered card is "Unverified" whatever it claims. */
export function cardStatus(read: { payload: SharePayload; signed: boolean }): CardStatus {
  if (!read.signed) return "unverified";
  return read.payload.practice ? "practice" : "verified";
}
