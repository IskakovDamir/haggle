// FAQ for the calculator page. Cited numbers carry their source; the worked example is computed by the engine.
import { getMarketStat } from "@/lib/benchmarks";
import type { FaqItem } from "@/lib/benchmarks/faq";
import { localizeStat } from "@/lib/benchmarks/locale";
import { formatPoints } from "@/lib/format";
import type { Locale } from "@/lib/i18n/locale";
import { formatDollars } from "@/lib/money";
import { calculate, defaultInput, minimumPaymentRule } from "./model";

export function calculatorFaq(lang: Locale = "en"): FaqItem[] {
  const example = defaultInput();
  const worked = calculate(example);
  const stat = (id: string) => localizeStat(getMarketStat(id), lang);
  const cut = formatPoints(example.cutBps);
  const balance = formatDollars(example.balanceCents);
  const saved = formatDollars(worked.yearSavedCents);

  if (lang === "es") {
    return [
      {
        question: "¿Cómo se calculan los intereses de una tarjeta de crédito?",
        answer: [
          "La mayoría de las tarjetas cobran intereses todos los días sobre tu saldo diario promedio. Esta calculadora usa una versión parecida y más simple: tu saldo por tu APR, dividido entre 12 para un mes. Tu estado de cuenta muestra los intereses exactos que te cobró el banco.",
        ],
      },
      {
        question: "¿Cuánto puedo ahorrar con un APR más bajo?",
        answer: [
          "La mayoría de quienes lo piden consiguen una reducción. El ",
          { stat: stat("market-apr-ask-success") },
          " de los titulares que pidieron una tasa más baja la consiguieron, y la reducción promedio fue de ",
          { stat: stat("market-apr-cut") },
          `. Calculado con esta herramienta, una reducción de ${cut} puntos en un saldo de ${balance} ahorra ${saved} el primer año.`,
        ],
      },
      {
        question: "¿Cuál es el APR promedio de las tarjetas de crédito hoy?",
        answer: ["En cuentas que pagaron intereses, ", { stat: stat("market-average-apr") }, "."],
      },
      {
        question: "¿Por qué tarda tanto pagar solo el mínimo?",
        answer: [
          `Un pago mínimo típico es el ${minimumPaymentRule("es")}. Al principio, casi todo el pago se va en intereses, así que el saldo baja despacio. Un APR más bajo hace que más de cada pago vaya a la deuda.`,
        ],
      },
      {
        question: "¿Haggle ve o guarda lo que escribo aquí?",
        answer: ["No. La calculadora funciona en tu navegador. Nada de lo que escribes se envía ni se guarda."],
      },
    ];
  }

  return [
    {
      question: "How is credit card interest calculated?",
      answer: [
        "Most cards charge interest every day on your average daily balance. This calculator uses a close, simpler version: your balance times your APR, divided by 12 for one month. Your statement shows the exact interest your bank charged.",
      ],
    },
    {
      question: "How much can a lower APR save?",
      answer: [
        "Most people who ask get a cut. ",
        { stat: stat("market-apr-ask-success") },
        " of cardholders who asked for a lower rate got one, and the average cut was ",
        { stat: stat("market-apr-cut") },
        `. Calculated with this tool, a ${cut}-point cut on a ${balance} balance saves ${saved} in the first year.`,
      ],
    },
    {
      question: "What is the average credit card APR right now?",
      answer: ["On accounts that were charged interest, ", { stat: stat("market-average-apr") }, "."],
    },
    {
      question: "Why does paying only the minimum take so long?",
      answer: [
        `A typical minimum is ${minimumPaymentRule()}. Most of each early payment goes to interest, so the balance shrinks slowly. A lower APR moves more of every payment onto the debt itself.`,
      ],
    },
    {
      question: "Does Haggle see or save what I type here?",
      answer: ["No. The calculator runs in your browser tab. Nothing you type is sent or stored."],
    },
  ];
}
