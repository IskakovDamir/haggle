// Read helpers for the phone directory.
import { DIRECTORY_AS_OF, ISSUERS } from "./data";
import type { Issuer, PhoneLine } from "./types";

export { DIRECTORY_AS_OF, ISSUERS };
export type * from "./types";

/** Issuers in A to Z order, for the index. Pass a group to list only banks or only store cards. */
export function issuersAtoZ(group?: Issuer["group"]): Issuer[] {
  return ISSUERS.filter((issuer) => !group || issuer.group === group).sort((a, b) => a.name.localeCompare(b.name));
}

export function getIssuer(slug: string): Issuer | undefined {
  return ISSUERS.find((issuer) => issuer.slug === slug);
}

export function mainLine(issuer: Issuer): PhoneLine {
  return issuer.lines[0];
}

/** "1-800-432-3117" -> "tel:+18004323117" */
export function telHref(display: string): string {
  return `tel:+${display.replace(/\D/g, "")}`;
}

export function directoryPath(issuer: Pick<Issuer, "slug">): string {
  return `/phone/${issuer.slug}`;
}

/** "Chase credit card customer service", but "Apple Card customer service" when the name already says card. */
export function serviceName(issuer: Pick<Issuer, "name">): string {
  return /\bcard\b/i.test(issuer.name) ? `${issuer.name} customer service` : `${issuer.name} credit card customer service`;
}
