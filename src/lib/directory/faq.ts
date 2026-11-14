// FAQ for an issuer's phone page, written from the directory and benchmark data. Same segment format as /insights.
// The issuer passed in is already localized (see localizeIssuer), so its labels and hours are in the page's language.
import { getBank, getMarketStat } from "@/lib/benchmarks";
import type { FaqItem, Segment } from "@/lib/benchmarks/faq";
import type { Locale } from "@/lib/i18n/locale";
import { mainLine } from "./index";
import { serviceNameFor } from "./locale";
import type { Issuer } from "./types";

export function issuerFaq(issuer: Issuer, lang: Locale = "en"): FaqItem[] {
  return lang === "es" ? issuerFaqEs(issuer) : issuerFaqEn(issuer);
}

function issuerFaqEn(issuer: Issuer): FaqItem[] {
  const name = issuer.name;
  const line = mainLine(issuer);
  const bank = issuer.insights ? getBank(issuer.insights) : undefined;
  const official: Segment = { source: issuer.source };
  const service = serviceNameFor(issuer, "en");

  return [
    {
      question: `What is the ${service} phone number?`,
      answer: [`${name}'s official site lists ${line.display} (${line.label}).${line.note ? ` ${line.note}` : ""}`, official],
    },
    {
      question: `Is ${service} open 24/7?`,
      answer: line.hours
        ? [`${name}'s official site lists these hours for that line: ${line.hours}.`, official]
        : [`${name}'s contact page does not list hours for this line. The number on the back of your card is the one ${name} expects you to use.`],
    },
    {
      question: `How do I reach a live person at ${name}?`,
      answer:
        issuer.menu.length > 0
          ? [
              ...issuer.menu.flatMap((fact): Segment[] => [`${fact.text}`, { source: fact.source }, " "]),
              "Have your card in hand before you call. Haggle can wait on hold for you and bring you in when a person picks up.",
            ]
          : [
              `We have not recorded the ${name} phone menu yet. Have your card in hand, and say "representative" if the menu does not offer a person. Haggle can wait on hold for you and bring you in when a person picks up.`,
            ],
    },
    {
      question: `Will ${name} refund a late fee if I call?`,
      answer: [
        "Often, yes. Across issuers, ",
        { stat: getMarketStat("market-late-fee-waived") },
        " of people who asked to have a late fee waived got it.",
        ...(bank ? ([` For ${bank.shortName}, we estimate `, { stat: bank.stats.lateFeeRefundRate }, " of requests are granted."] as Segment[]) : []),
      ],
    },
    {
      question: `Can I ask ${name} for a lower interest rate?`,
      answer: [
        "Yes, and it usually works. ",
        { stat: getMarketStat("market-apr-ask-success") },
        " of cardholders who asked for a lower rate got one, and the average cut was ",
        { stat: getMarketStat("market-apr-cut") },
        ".",
      ],
    },
    {
      question: `Is Haggle part of ${name}?`,
      answer: [`No. Haggle is not affiliated with ${name}. We list ${name}'s own published numbers and link to the page we read them from.`],
    },
  ];
}

function issuerFaqEs(issuer: Issuer): FaqItem[] {
  const name = issuer.name;
  const line = mainLine(issuer);
  const bank = issuer.insights ? getBank(issuer.insights) : undefined;
  const official: Segment = { source: issuer.source };

  return [
    {
      question: `¿Cuál es el teléfono de servicio al cliente de ${/\bcard\b/i.test(name) ? name : `tarjetas de crédito ${name}`}?`,
      answer: [`El sitio oficial de ${name} indica el ${line.display} (${line.label}).${line.note ? ` ${line.note}` : ""}`, official],
    },
    {
      question: `¿El servicio al cliente de ${name} atiende 24/7?`,
      answer: line.hours
        ? [`El sitio oficial de ${name} indica este horario para esa línea: ${line.hours}.`, official]
        : [`La página de contacto de ${name} no indica el horario de esta línea. Usa el número que aparece en el reverso de tu tarjeta.`],
    },
    {
      question: `¿Cómo hablo con una persona en ${name}?`,
      answer:
        issuer.menu.length > 0
          ? [
              ...issuer.menu.flatMap((fact): Segment[] => [`${fact.text}`, { source: fact.source }, " "]),
              "Ten tu tarjeta a mano antes de llamar. Haggle puede esperar en línea por ti y avisarte cuando conteste una persona.",
            ]
          : [
              `Todavía no hemos registrado el menú telefónico de ${name}. Ten tu tarjeta a mano y di "representante" si el menú no ofrece hablar con una persona. Haggle puede esperar en línea por ti y avisarte cuando conteste una persona.`,
            ],
    },
    {
      question: `¿${name} me devuelve un cargo por pago atrasado si llamo?`,
      answer: [
        "Muchas veces, sí. Entre todos los emisores, al ",
        { stat: getMarketStat("market-late-fee-waived") },
        " de quienes pidieron que les quitaran un cargo por pago atrasado se lo quitaron.",
        ...(bank ? ([` Para ${bank.shortName}, estimamos que se aprueba el `, { stat: bank.stats.lateFeeRefundRate }, " de las solicitudes."] as Segment[]) : []),
      ],
    },
    {
      question: `¿Puedo pedirle a ${name} una tasa de interés más baja?`,
      answer: [
        "Sí, y casi siempre funciona. El ",
        { stat: getMarketStat("market-apr-ask-success") },
        " de los titulares que pidieron una tasa más baja la consiguieron, y la reducción promedio fue de ",
        { stat: getMarketStat("market-apr-cut") },
        ".",
      ],
    },
    {
      question: `¿Haggle es parte de ${name}?`,
      answer: [`No. Haggle no tiene relación con ${name}. Publicamos los números oficiales de ${name} y enlazamos la página de donde los tomamos.`],
    },
  ];
}
