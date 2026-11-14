// JSON-LD for the phone directory.
import { siteUrl } from "@/lib/benchmarks/site";
import { directoryPath, mainLine, serviceName } from "./index";
import type { Issuer } from "./types";

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({ "@type": "ListItem", position: i + 1, name: item.name, item: `${siteUrl()}${item.path}` })),
  };
}

export function directoryListJsonLd(issuers: Issuer[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Credit card customer service phone numbers",
    itemListElement: issuers.map((issuer, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: `${serviceName(issuer)}: ${mainLine(issuer).display}`,
      url: `${siteUrl()}${directoryPath(issuer)}`,
    })),
  };
}
