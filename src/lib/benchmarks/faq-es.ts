// The insights FAQ in Spanish, plus one entry point per page that picks the language.
// Same questions and the same stats as faq.ts; only the words differ.
import type { Locale } from "@/lib/i18n/locale";
import { bankFaq, lowerAprFaq, missedPaymentFaq, type FaqItem, type Segment } from "./faq";
import { banksBy, getMarketStat } from "./index";
import { localizeBank, localizeStat, localizedTimeline } from "./locale";
import type { Bank } from "./types";

const es = (id: string) => localizeStat(getMarketStat(id), "es");

function step(id: string) {
  const found = localizedTimeline("es").find((s) => s.id === id);
  if (!found) throw new Error(`Unknown timeline step: ${id}`);
  return found;
}

function creditReport(): Segment[] {
  const s = step("timeline-credit-report");
  return [s.text, { source: s.source }];
}

function penaltyRate(): Segment[] {
  const s = step("timeline-penalty-rate");
  const back = step("timeline-rate-restored");
  return [`${s.text} ${back.text}`, { source: s.source }];
}

function bankFaqEs(raw: Bank): FaqItem[] {
  const bank = localizeBank(raw, "es");
  const name = bank.shortName;
  const { lateFeeRefundRate, lateFeeMax, typicalAprCut, waitToPerson } = bank.stats;
  const items: FaqItem[] = [
    {
      question: `¿${name} me devuelve el cargo por pago atrasado si lo pido?`,
      answer: [
        "Por lo general, sí. Entre todos los emisores, al ",
        { stat: es("market-late-fee-waived") },
        " de quienes pidieron quitar un cargo por pago atrasado se lo quitaron. Para ",
        name,
        ", estimamos que se aprueba el ",
        { stat: lateFeeRefundRate },
        " de las solicitudes.",
        ...bank.facts.flatMap((fact): Segment[] => [` ${fact.text}`, { source: fact.source }]),
      ],
    },
    {
      question: `¿Cuánto es el cargo por pago atrasado en una tarjeta ${name}?`,
      answer: [
        "Estimamos que hasta ",
        { stat: lateFeeMax },
        ` en una tarjeta ${name}. El límite legal para un emisor grande es de `,
        { stat: es("market-late-fee-cap-first") },
        " por un primer pago atrasado y de ",
        { stat: es("market-late-fee-cap-repeat") },
        " si también te atrasaste en alguno de los seis ciclos de facturación anteriores.",
      ],
    },
    {
      question: `¿Puedo conseguir un APR más bajo con ${name}?`,
      answer: [
        "La mayoría de quienes lo piden lo consiguen. El ",
        { stat: es("market-apr-ask-success") },
        " de los titulares que pidieron una tasa más baja la consiguieron, y la reducción promedio fue de ",
        { stat: es("market-apr-cut") },
        `. Cuando ${name} dice que sí, estimamos una reducción de unos `,
        { stat: typicalAprCut },
        ".",
      ],
    },
    { question: `¿Un pago atrasado con ${name} afecta mi puntaje de crédito?`, answer: ["No de inmediato. ", ...creditReport()] },
    { question: `¿${name} puede subirme la tasa después de un pago atrasado?`, answer: penaltyRate() },
  ];

  if (bank.extraStats.length > 0) {
    const reports = bank.extraStats.flatMap((stat, i): Segment[] => [i === 0 ? "" : " Otro reporte dice ", { stat }, ` (${stat.label}).`]);
    items.push({
      question: `¿Cuánto hay que esperar para hablar con una persona en ${name}?`,
      answer: ["Los reportes públicos no coinciden. Uno dice ", ...reports, " Nuestra propia estimación es de ", { stat: waitToPerson }, "."],
    });
  } else {
    items.push({
      question: `¿Cuánto hay que esperar para hablar con una persona en ${name}?`,
      answer: ["Estimamos ", { stat: waitToPerson }, ". Haggle espera en línea por ti y solo te pide entrar para confirmar que eres tú."],
    });
  }
  return items;
}

function missedPaymentFaqEs(): FaqItem[] {
  const top = localizeBank(banksBy("lateFeeRefundRate")[0], "es");
  return [
    {
      question: "¿Qué banco tiene más probabilidades de devolver un cargo por pago atrasado?",
      answer: ["Según nuestras estimaciones, ", top.shortName, " aprueba la mayor parte de las solicitudes, el ", { stat: top.stats.lateFeeRefundRate }, "."],
    },
    {
      question: "¿Funciona pedir que te devuelvan un cargo por pago atrasado?",
      answer: ["Por lo general, sí. Al ", { stat: es("market-late-fee-waived") }, " de quienes lo pidieron les quitaron el cargo."],
    },
    {
      question: "¿Cuánto puede ser un cargo por pago atrasado de tarjeta de crédito?",
      answer: [
        "En un emisor grande, hasta ",
        { stat: es("market-late-fee-cap-first") },
        " por un primer pago atrasado y hasta ",
        { stat: es("market-late-fee-cap-repeat") },
        " si también te atrasaste en alguno de los seis ciclos de facturación anteriores.",
      ],
    },
    { question: "¿Cuándo aparece un pago atrasado en mi reporte de crédito?", answer: creditReport() },
    { question: "¿Mi banco puede subirme la tasa por un solo pago atrasado?", answer: penaltyRate() },
  ];
}

function lowerAprFaqEs(): FaqItem[] {
  const top = localizeBank(banksBy("typicalAprCut")[0], "es");
  return [
    {
      question: "¿Funciona pedir un APR más bajo en la tarjeta de crédito?",
      answer: [
        "Casi siempre. El ",
        { stat: es("market-apr-ask-success") },
        " de los titulares que lo pidieron consiguieron una tasa más baja, y la reducción promedio fue de ",
        { stat: es("market-apr-cut") },
        ".",
      ],
    },
    {
      question: "¿Cuál es el APR promedio de las tarjetas de crédito hoy?",
      answer: ["En cuentas que pagaron intereses, ", { stat: es("market-average-apr") }, "."],
    },
    {
      question: "¿Qué banco da la mayor reducción de tasa?",
      answer: ["Según nuestras estimaciones, ", top.shortName, ", con unos ", { stat: top.stats.typicalAprCut }, " cuando dice que sí."],
    },
    {
      question: "¿Pedir una tasa más baja afecta mi crédito?",
      answer: [
        "Pedir una tasa más baja suele ser una llamada, no una solicitud nueva, así que normalmente no requiere una consulta de crédito completa. Haggle le pregunta al banco antes de aceptar algo que sí la requiera.",
      ],
    },
  ];
}

export function bankFaqFor(bank: Bank, lang: Locale): FaqItem[] {
  return lang === "es" ? bankFaqEs(bank) : bankFaq(bank);
}

export function missedPaymentFaqFor(lang: Locale): FaqItem[] {
  return lang === "es" ? missedPaymentFaqEs() : missedPaymentFaq();
}

export function lowerAprFaqFor(lang: Locale): FaqItem[] {
  return lang === "es" ? lowerAprFaqEs() : lowerAprFaq();
}
