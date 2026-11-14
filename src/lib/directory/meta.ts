// Page metadata for the phone directory in both languages, with hreflang links between them.
import type { Metadata } from "next";
import type { Locale } from "@/lib/i18n/locale";
import { mainLine } from "./index";
import { languageAlternates, phoneIndexPath, phonePath, serviceNameFor } from "./locale";
import type { Issuer } from "./types";

/** "chase credit card customer service" -> "Chase Credit Card Customer Service". Only letters after a space change. */
function titleCase(text: string): string {
  return text.replace(/(^|\s)([a-z])/g, (_, space: string, c: string) => space + c.toUpperCase());
}

export function issuerMetadata(issuer: Issuer, lang: Locale): Metadata {
  const line = mainLine(issuer);
  const service = serviceNameFor(issuer, lang);
  const title =
    lang === "es" ? `Teléfono de ${service.charAt(0).toLowerCase()}${service.slice(1)}: ${line.display}` : `${titleCase(service)} Phone Number: ${line.display}`;
  const description =
    lang === "es"
      ? `Llama al ${line.display}. El número oficial de ${issuer.name}${line.hours ? " y su horario" : ""}, qué tener a mano y qué decir para recuperar un cargo por pago atrasado o bajar tu tasa.`
      : `Call ${service} at ${line.display}. The official number${line.hours ? " and hours" : ""}, what to have ready, and what to say to get a late fee back or a lower rate.`;
  const path = phonePath(issuer, lang);
  return {
    title,
    description,
    alternates: { canonical: path, languages: languageAlternates(phonePath(issuer, "en"), phonePath(issuer, "es")) },
    openGraph: { title, description, url: path, locale: lang === "es" ? "es_US" : "en_US" },
  };
}

export function indexMetadata(lang: Locale): Metadata {
  const title =
    lang === "es"
      ? "Teléfonos de servicio al cliente de tarjetas de crédito en EE. UU."
      : "Credit card customer service phone numbers for every major US issuer and store card";
  const description =
    lang === "es"
      ? "Números oficiales de Chase, Amex, Citi, Capital One, Bank of America, Discover y tarjetas de tiendas como Amazon, Target, Costco y PayPal. Verificados en cada sitio oficial, con qué decir al llamar."
      : "Official customer service numbers for Chase, Amex, Citi, Capital One, Bank of America, Discover, plus store cards like Amazon, Target, Costco and PayPal. Each checked on the official site, with what to say when you call.";
  const path = phoneIndexPath(lang);
  return {
    title,
    description,
    alternates: { canonical: path, languages: languageAlternates(phoneIndexPath("en"), phoneIndexPath("es")) },
    openGraph: { title, description, url: path, locale: lang === "es" ? "es_US" : "en_US" },
  };
}
