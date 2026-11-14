// Page metadata for the insights pages and the calculator in both languages, with hreflang links between them.
import type { Metadata } from "next";
import type { Locale } from "@/lib/i18n/locale";
import { languageAlternates } from "@/lib/directory/locale";
import { getTopic } from "./index";
import { calculatorPath, insightsBankPath, insightsIndexPath, insightsTopicPath, localizeTopic } from "./locale";
import type { Bank, TopicSlug } from "./types";

function page(lang: Locale, en: string, es: string, title: string, description: string): Metadata {
  const path = lang === "es" ? es : en;
  return {
    title,
    description,
    alternates: { canonical: path, languages: languageAlternates(en, es) },
    openGraph: { title, description, url: path, locale: lang === "es" ? "es_US" : "en_US" },
  };
}

export function insightsIndexMetadata(lang: Locale): Metadata {
  return lang === "es"
    ? page(
        lang,
        insightsIndexPath("en"),
        insightsIndexPath("es"),
        "Datos de tarjetas de crédito: cargos por atraso, reducciones de tasa y esperas por banco",
        "El 84% de los titulares que pidieron un APR más bajo lo consiguieron. Cargos, devoluciones, reducciones y esperas en Chase, Capital One, Citi, Amex y Discover, con cada número citado o marcado como estimación.",
      )
    : page(
        lang,
        insightsIndexPath("en"),
        insightsIndexPath("es"),
        "Credit card benchmarks: late fees, rate cuts and wait times by bank",
        "84% of cardholders who asked for a lower APR got one. Late fees, refunds, rate cuts and hold times for Chase, Capital One, Citi, Amex and Discover, every number sourced or labelled.",
      );
}

export function insightsBankMetadata(bank: Bank, lang: Locale): Metadata {
  const name = bank.shortName;
  const en = insightsBankPath(bank.slug, "en");
  const es = insightsBankPath(bank.slug, "es");
  return lang === "es"
    ? page(
        lang,
        en,
        es,
        `¿Te atrasaste en un pago de tu tarjeta ${name}? Qué pasa y cómo recuperar el cargo`,
        `Qué pasa después de un pago atrasado con ${name}, qué tan seguido ${name} devuelve el cargo, cuánto pedir que te baje la tasa y cuánto esperas para hablar con alguien. Cada número citado o marcado.`,
      )
    : page(
        lang,
        en,
        es,
        `Missed a ${name} credit card payment? What happens and how to get the late fee back`,
        `What happens after a missed ${name} payment, how often ${name} refunds late fees, how much of a rate cut to ask for, and how long you wait for a person. Every number sourced or labelled.`,
      );
}

export function insightsTopicMetadata(slug: TopicSlug, lang: Locale): Metadata {
  const topic = localizeTopic(getTopic(slug)!, lang);
  return page(lang, insightsTopicPath(slug, "en"), insightsTopicPath(slug, "es"), topic.title, topic.description);
}

export function calculatorMetadata(lang: Locale): Metadata {
  return lang === "es"
    ? page(
        lang,
        calculatorPath("en"),
        calculatorPath("es"),
        "Calculadora de intereses de tarjetas de crédito: cuánto ahorras con un APR más bajo",
        "Escribe tu saldo y tu APR para ver los intereses del mes y del año, cuánto tardas en pagar con el mínimo y cuánto te ahorraría una tasa más baja. Gratis y sin guardar nada.",
      )
    : page(
        lang,
        calculatorPath("en"),
        calculatorPath("es"),
        "Credit Card Interest Calculator: See What a Lower APR Saves",
        "Enter your balance and APR to see this month's interest, a year of interest, how long minimum payments take, and how much a lower rate would save. Free, nothing saved.",
      );
}
