// The phone directory in two languages. Data strings (line labels, notes, hours) are written in English in data.ts;
// this file holds their Spanish versions. A missing translation throws, and the tests check every issuer.
import type { Locale } from "@/lib/i18n/locale";
import type { Issuer } from "./types";

/** English string -> Spanish string. Brand names and numbers stay as they are. */
const ES: Record<string, string> = {
  // Line labels
  "Credit card customer service": "Servicio al cliente de tarjetas de crédito",
  "Personal banking customer service": "Servicio al cliente de banca personal",
  "Card member customer service": "Servicio al cliente para titulares de tarjeta",
  "Make a payment": "Hacer un pago",
  "Small business cards customer service": "Servicio al cliente de tarjetas para pequeñas empresas",
  "Credit card customer service, including lost or stolen cards": "Servicio al cliente de tarjetas de crédito, incluidas tarjetas perdidas o robadas",
  "Calling from outside the US": "Llamadas desde fuera de EE. UU.",
  "Card activation": "Activación de la tarjeta",
  "Billing questions": "Preguntas sobre facturación",
  "Credit card customer support": "Atención al cliente de tarjetas de crédito",
  "Calling from outside the US (collect)": "Llamadas desde fuera de EE. UU. (por cobrar)",
  "Credit card, calling from outside the US (collect)": "Tarjeta de crédito, llamadas desde fuera de EE. UU. (por cobrar)",
  "Credit card online account support": "Ayuda con la cuenta en línea de la tarjeta de crédito",
  "Member services, including lost or stolen cards": "Servicios para miembros, incluidas tarjetas perdidas o robadas",
  Collections: "Cobranzas",
  "Business credit card": "Tarjeta de crédito para empresas",
  "General card customer service": "Servicio al cliente general de tarjetas",
  "CareCredit account help": "Ayuda con la cuenta CareCredit",
  "Altitude Reserve card": "Tarjeta Altitude Reserve",
  "Rewards center": "Centro de recompensas",
  "Apple Card support by Goldman Sachs": "Soporte de Apple Card de Goldman Sachs",
  "Amazon Store Card (Synchrony Bank)": "Amazon Store Card (Synchrony Bank)",
  "Amazon Prime Visa (Chase)": "Amazon Prime Visa (Chase)",
  "Amazon Secured Card (Synchrony Bank)": "Amazon Secured Card (Synchrony Bank)",
  "Best Buy credit cards": "Tarjetas de crédito de Best Buy",
  "Costco Anywhere Visa card, Citi customer service": "Tarjeta Costco Anywhere Visa, servicio al cliente de Citi",
  "Costco Member Services": "Servicios para miembros de Costco",
  "Kohl's Card and payment questions": "Tarjeta Kohl's y preguntas sobre pagos",
  "Kohls.com and order questions": "Kohls.com y preguntas sobre pedidos",
  "MyLowe's Rewards Credit Card": "MyLowe's Rewards Credit Card",
  "Macy's Credit Customer Care": "Atención al cliente de crédito de Macy's",
  "Macy's Customer Care (orders and stores)": "Atención al cliente de Macy's (pedidos y tiendas)",
  "PayPal Credit Card": "PayPal Credit Card",
  "PayPal Credit digital line": "Línea digital de PayPal Credit",
  "PayPal Cashback Mastercard": "PayPal Cashback Mastercard",
  "Target Credit Card and Target Mastercard": "Target Credit Card y Target Mastercard",
  "Target Mastercard, calling from outside the US": "Target Mastercard, llamadas desde fuera de EE. UU.",

  // Notes
  "Printed as 1-800-CAPITAL.": "Aparece como 1-800-CAPITAL.",
  "Printed as 1-800-DISCOVER.": "Aparece como 1-800-DISCOVER.",
  "Synchrony lists this when you cannot find the right department. Most store cards have their own number on the back of the card.":
    "Synchrony da este número cuando no encuentras el departamento correcto. La mayoría de las tarjetas de tiendas tienen su propio número en el reverso.",
  "Apple lists this number for a replacement card. Most Apple Card help happens in Messages on your iPhone.":
    "Apple da este número para pedir una tarjeta de reemplazo. Casi toda la ayuda de Apple Card se da en Mensajes en tu iPhone.",
  "TTY: dial 711.": "TTY: marca 711.",
  "Costco points here for errors on the back of the card.": "Costco indica este número para errores en el reverso de la tarjeta.",

  // Hours
  "24/7": "24/7",
  "Mon to Fri 8 am to 9 pm ET, Sat 9 am to 5:30 pm ET": "Lun a vie de 8 a. m. a 9 p. m. ET, sáb de 9 a. m. a 5:30 p. m. ET",

  // Issued by
  "Synchrony Bank (Store Card and Secured Card) and Chase (Prime Visa)": "Synchrony Bank (Store Card y Secured Card) y Chase (Prime Visa)",
  Citibank: "Citibank",
  Citi: "Citi",
  "Synchrony Bank": "Synchrony Bank",

  // Menu facts
  "On the Chase Sapphire line, the first prompt asks for your full 16-digit card number.":
    "En la línea de Chase Sapphire, el primer mensaje pide el número completo de 16 dígitos de tu tarjeta.",
};

/** One data string in the visitor's language. Throws on a missing Spanish entry so nothing ships half translated. */
export function tr(text: string, locale: Locale): string {
  if (locale === "en") return text;
  const es = ES[text];
  if (es === undefined) throw new Error(`Missing Spanish for directory text: "${text}"`);
  return es;
}

/** The issuer with every displayed data string in the visitor's language. */
export function localizeIssuer(issuer: Issuer, locale: Locale): Issuer {
  if (locale === "en") return issuer;
  return {
    ...issuer,
    issuedBy: issuer.issuedBy && tr(issuer.issuedBy, locale),
    lines: issuer.lines.map((line) => ({
      ...line,
      label: tr(line.label, locale),
      hours: line.hours && tr(line.hours, locale),
      note: line.note && tr(line.note, locale),
    })),
    menu: issuer.menu.map((fact) => ({ ...fact, text: tr(fact.text, locale) })),
  };
}

export function phoneIndexPath(locale: Locale): string {
  return locale === "es" ? "/es/telefonos" : "/phone";
}

export function phonePath(issuer: Pick<Issuer, "slug">, locale: Locale): string {
  return `${phoneIndexPath(locale)}/${issuer.slug}`;
}

/** "Chase credit card customer service" / "servicio al cliente de la tarjeta de crédito Chase". */
export function serviceNameFor(issuer: Pick<Issuer, "name">, locale: Locale): string {
  const card = /\bcard\b/i.test(issuer.name);
  if (locale === "es") return card ? `Servicio al cliente de ${issuer.name}` : `Servicio al cliente de tarjetas de crédito ${issuer.name}`;
  return card ? `${issuer.name} customer service` : `${issuer.name} credit card customer service`;
}

/** hreflang links for a page that exists in both languages. */
export function languageAlternates(enPath: string, esPath: string) {
  return { "en-US": enPath, "es-US": esPath, "x-default": enPath };
}
