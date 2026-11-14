// The benchmark dataset in Spanish. data.ts stays the single source of numbers and sources; this file only
// translates the words around them. A missing translation throws, and the tests localize every stat.
import type { Locale } from "@/lib/i18n/locale";
import { BANKS, MISSED_PAYMENT_TIMELINE, TOPICS } from "./data";
import type { Bank, BankMetric, Fact, Stat, TimelineStep, Topic, TopicSlug } from "./types";

const MARKET_ES: Record<string, string> = {
  "market-apr-ask-success": "de los titulares que pidieron un APR más bajo lo consiguieron",
  "market-apr-cut": "reducción promedio de la tasa para quienes la consiguieron",
  "market-late-fee-waived": "de quienes pidieron quitar un cargo por pago atrasado lo consiguieron",
  "market-annual-fee-waived": "de quienes lo pidieron consiguieron eliminar o bajar la cuota anual",
  "market-card-balances": "en saldos de tarjetas de crédito en EE. UU., 3er trimestre de 2026",
  "market-average-apr": "APR promedio en cuentas que pagaron intereses, agosto de 2026",
  "market-late-fee-cap-first": "lo máximo que un emisor grande puede cobrar por un primer pago atrasado",
  "market-late-fee-cap-repeat": "lo máximo si te atrasaste otra vez dentro de seis ciclos de facturación",
  "market-satisfaction-average": "puntaje promedio de satisfacción de tarjetas de crédito de J.D. Power 2025",
  "chase-hold-gethuman": "espera promedio en la línea internacional de tarjetas de Chase, de 783 llamadas en 90 días",
  "chase-hold-donotpay": "espera habitual en la línea principal de Chase",
};

const BANK_METRIC_ES: Record<BankMetric, (name: string) => string> = {
  satisfaction: (name) => `puntaje de satisfacción de clientes de ${name}, sobre 1,000`,
  waitToPerson: (name) => `para hablar con una persona en ${name}`,
  lateFeeMax: (name) => `el cargo por pago atrasado más alto en una tarjeta ${name}`,
  lateFeeRefundRate: (name) => `de las solicitudes de devolución del cargo que ${name} aprueba`,
  typicalAprCut: (name) => `reducción típica de la tasa cuando ${name} dice que sí`,
};

const NOTES_ES: Record<string, string> = {
  "Haggle demo estimate. We will replace it with numbers measured on our own calls.":
    "Estimación de demostración de Haggle. La reemplazaremos con datos medidos en nuestras propias llamadas.",
  "The 2024 rule that cut this to $8 was vacated by a court on April 15, 2025, so the earlier safe harbor amounts apply.":
    "La regla de 2024 que lo bajaba a $8 fue anulada por un tribunal el 15 de abril de 2025, así que siguen vigentes los montos anteriores.",
  "The article was first published in 2021 and last updated in May 2026.": "El artículo se publicó en 2021 y se actualizó por última vez en mayo de 2026.",
};

const TIMELINE_ES: Record<string, { when: string; text: string }> = {
  "timeline-late-fee": {
    when: "El día después del vencimiento",
    text: "El emisor puede cobrar un cargo por pago atrasado. En un emisor grande puede ser de hasta $30 la primera vez, y de hasta $41 si también te atrasaste en alguno de los seis ciclos de facturación anteriores.",
  },
  "timeline-credit-report": {
    when: "Unos 30 días de atraso",
    text: "Los emisores reportan el pago atrasado a las agencias de crédito después de unos 30 días, y tu puntaje de crédito puede bajar.",
  },
  "timeline-penalty-rate": {
    when: "60 días de atraso",
    text: "Solo cuando un pago mínimo lleva más de 60 días de atraso puede el emisor aplicar una tasa de penalización al saldo que ya tienes.",
  },
  "timeline-rate-restored": {
    when: "Seis pagos a tiempo después",
    text: "Si después haces seis pagos mínimos seguidos a tiempo, el emisor debe bajar la tasa de ese saldo a la que tenía antes.",
  },
};

const FACTS_ES: Record<string, string> = {
  "discover-first-late-fee": "Discover elimina automáticamente tu primer cargo por pago atrasado.",
  "chase-menu-card-number": "En la línea de Chase Sapphire, el primer mensaje pide el número completo de 16 dígitos de tu tarjeta.",
};

const TOPICS_ES: Record<TopicSlug, Pick<Topic, "title" | "description" | "ctaLabel">> = {
  "missed-payment": {
    title: "¿Te atrasaste en un pago de tu tarjeta? Cómo maneja cada banco el cargo por pago atrasado",
    description:
      "Qué pasa después de un pago atrasado de tarjeta de crédito, y cómo se comparan Chase, Capital One, Citi, Amex y Discover en cargos y devoluciones.",
    ctaLabel: "Que Haggle llame a tu banco por un pago atrasado",
  },
  "lower-apr": {
    title: "Cómo conseguir un APR más bajo en tu tarjeta, banco por banco",
    description:
      "La mayoría de los titulares que piden una tasa más baja la consiguen. Cómo se comparan Chase, Capital One, Citi, Amex y Discover en reducciones y tiempos de espera.",
    ctaLabel: "Que Haggle le pida a tu banco una tasa más baja",
  },
};

/** Spanish URL segments for the insights pages. Bank slugs stay as they are. */
export const TOPIC_SLUG_ES: Record<TopicSlug, string> = { "missed-payment": "pago-atrasado", "lower-apr": "bajar-la-tasa" };

function missing(kind: string, id: string): never {
  throw new Error(`Missing Spanish ${kind}: ${id}`);
}

function bankForStat(id: string): { bank: Bank; metric: BankMetric } | undefined {
  for (const bank of BANKS) {
    for (const [metric, stat] of Object.entries(bank.stats) as [BankMetric, Stat][]) {
      if (stat.id === id) return { bank, metric };
    }
  }
  return undefined;
}

export function localizeStat(stat: Stat, lang: Locale): Stat {
  if (lang === "en") return stat;
  const owner = bankForStat(stat.id);
  const label = owner ? BANK_METRIC_ES[owner.metric](owner.bank.shortName) : (MARKET_ES[stat.id] ?? missing("stat label", stat.id));
  const note = stat.note === undefined ? undefined : (NOTES_ES[stat.note] ?? missing("note", stat.id));
  return { ...stat, label, note };
}

export function localizeFact(fact: Fact, lang: Locale): Fact {
  if (lang === "en") return fact;
  const note = fact.note === undefined ? undefined : (NOTES_ES[fact.note] ?? missing("note", fact.id));
  return { ...fact, text: FACTS_ES[fact.id] ?? missing("fact", fact.id), note };
}

export function localizeBank(bank: Bank, lang: Locale): Bank {
  if (lang === "en") return bank;
  return {
    ...bank,
    stats: Object.fromEntries(Object.entries(bank.stats).map(([k, s]) => [k, localizeStat(s, lang)])) as Bank["stats"],
    extraStats: bank.extraStats.map((s) => localizeStat(s, lang)),
    phoneMenu: bank.phoneMenu.map((f) => localizeFact(f, lang)),
    facts: bank.facts.map((f) => localizeFact(f, lang)),
  };
}

export function localizedTimeline(lang: Locale): TimelineStep[] {
  if (lang === "en") return MISSED_PAYMENT_TIMELINE;
  return MISSED_PAYMENT_TIMELINE.map((step) => ({ ...step, ...(TIMELINE_ES[step.id] ?? missing("timeline step", step.id)) }));
}

export function localizeTopic(topic: Topic, lang: Locale): Topic {
  return lang === "en" ? topic : { ...topic, ...TOPICS_ES[topic.slug] };
}

export function localizedTopics(lang: Locale): Topic[] {
  return TOPICS.map((t) => localizeTopic(t, lang));
}

// Paths for the insights pages in each language.
export function insightsIndexPath(lang: Locale): string {
  return lang === "es" ? "/es/datos" : "/insights";
}

export function insightsBankPath(slug: string, lang: Locale): string {
  return `${insightsIndexPath(lang)}/${slug}`;
}

export function insightsTopicPath(slug: TopicSlug, lang: Locale): string {
  return `${insightsIndexPath(lang)}/${lang === "es" ? TOPIC_SLUG_ES[slug] : slug}`;
}

export function calculatorPath(lang: Locale): string {
  return lang === "es" ? "/es/herramientas/calculadora-de-intereses" : "/tools/credit-card-interest-calculator";
}
