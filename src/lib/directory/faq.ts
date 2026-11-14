// FAQ for an issuer's phone page, written from the directory and benchmark data. Same segment format as /insights.
import { getBank, getMarketStat } from "@/lib/benchmarks";
import type { FaqItem, Segment } from "@/lib/benchmarks/faq";
import { mainLine, serviceName } from "./index";
import type { Issuer } from "./types";

export function issuerFaq(issuer: Issuer): FaqItem[] {
  const name = issuer.name;
  const line = mainLine(issuer);
  const bank = issuer.insights ? getBank(issuer.insights) : undefined;
  const official: Segment = { source: issuer.source };

  const items: FaqItem[] = [
    {
      question: `What is the ${serviceName(issuer)} phone number?`,
      answer: [`${name}'s official site lists ${line.display} (${line.label}).${line.note ? ` ${line.note}` : ""}`, official],
    },
    {
      question: `Is ${serviceName(issuer)} open 24/7?`,
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
  return items;
}
