// JSON-LD for the phone directory.
import { siteUrl } from "@/lib/benchmarks/site";
import type { Locale } from "@/lib/i18n/locale";
import { mainLine } from "./index";
import { phonePath, serviceNameFor } from "./locale";
import type { Issuer } from "./types";

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({ "@type": "ListItem", position: i + 1, name: item.name, item: `${siteUrl()}${item.path}` })),
  };
}

export function directoryListJsonLd(issuers: Issuer[], lang: Locale = "en") {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: lang === "es" ? "Teléfonos de servicio al cliente de tarjetas de crédito" : "Credit card customer service phone numbers",
    inLanguage: lang === "es" ? "es-US" : "en-US",
    itemListElement: issuers.map((issuer, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: `${serviceNameFor(issuer, lang)}: ${mainLine(issuer).display}`,
      url: `${siteUrl()}${phonePath(issuer, lang)}`,
    })),
  };
}
