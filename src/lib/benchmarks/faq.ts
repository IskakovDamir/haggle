// FAQ answers written from the dataset. An answer is a list of segments so the page can show each number
// with its label or source link, and JSON-LD gets the same answer as plain text with the provenance spelled out.
import { DATASET_AS_OF, MISSED_PAYMENT_TIMELINE } from "./data";
import { banksBy, formatStatValue, getMarketStat, provenanceText } from "./index";
import type { Bank, Source, Stat } from "./types";

export type Segment = string | { stat: Stat } | { source: Source };
export type FaqItem = { question: string; answer: Segment[] };

const step = (id: string) => {
  const found = MISSED_PAYMENT_TIMELINE.find((s) => s.id === id);
  if (!found) throw new Error(`Unknown timeline step: ${id}`);
  return found;
};

/** "84% (Source: LendingTree survey, via KKTV)" and plain sentences, for JSON-LD. */
export function answerText(answer: Segment[]): string {
  return answer
    .map((part) => {
      if (typeof part === "string") return part;
      if ("stat" in part) return `${formatStatValue(part.stat)} (${provenanceText(part.stat)})`;
      return ` (Source: ${part.source.name})`;
    })
    .join("");
}

function creditReport(): FaqItem["answer"] {
  const s = step("timeline-credit-report");
  return [s.text, { source: s.source }];
}

function penaltyRate(): FaqItem["answer"] {
  const s = step("timeline-penalty-rate");
  const back = step("timeline-rate-restored");
  return [`${s.text} ${back.text}`, { source: s.source }];
}

export function bankFaq(bank: Bank): FaqItem[] {
  const name = bank.shortName;
  const { lateFeeRefundRate, lateFeeMax, typicalAprCut, waitToPerson } = bank.stats;
  const items: FaqItem[] = [
    {
      question: `Will ${name} refund a late fee if I ask?`,
      answer: [
        "Usually, yes. Across issuers, ",
        { stat: getMarketStat("market-late-fee-waived") },
        " of people who asked to have a late fee waived got it. For ",
        name,
        ", we estimate ",
        { stat: lateFeeRefundRate },
        " of requests are granted.",
        ...bank.facts.flatMap((fact): Segment[] => [` ${fact.text}`, { source: fact.source }]),
      ],
    },
    {
      question: `How much is the late fee on a ${name} credit card?`,
      answer: [
        "We estimate up to ",
        { stat: lateFeeMax },
        ` on a ${name} card. The legal limit for a big issuer is `,
        { stat: getMarketStat("market-late-fee-cap-first") },
        " for a first late payment and ",
        { stat: getMarketStat("market-late-fee-cap-repeat") },
        " if you were also late in one of the six billing cycles before.",
      ],
    },
    {
      question: `Can I get a lower APR from ${name}?`,
      answer: [
        "Most people who ask get one. ",
        { stat: getMarketStat("market-apr-ask-success") },
        " of cardholders who asked for a lower rate got it, and the average cut was ",
        { stat: getMarketStat("market-apr-cut") },
        `. When ${name} says yes, we estimate a cut of about `,
        { stat: typicalAprCut },
        ".",
      ],
    },
    { question: `Will a missed ${name} payment hurt my credit score?`, answer: ["Not right away. ", ...creditReport()] },
    { question: `Can ${name} raise my rate after a missed payment?`, answer: penaltyRate() },
  ];

  if (bank.extraStats.length > 0) {
    const reports = bank.extraStats.flatMap((stat, i): Segment[] => [i === 0 ? "" : " Another report puts it at ", { stat }, ` (${stat.label}).`]);
    items.push({
      question: `How long is the wait to reach a person at ${name}?`,
      answer: ["Public reports disagree. One report says ", ...reports, " Our own estimate is ", { stat: waitToPerson }, "."],
    });
  } else {
    items.push({
      question: `How long is the wait to reach a person at ${name}?`,
      answer: ["We estimate ", { stat: waitToPerson }, ". Haggle waits on hold for you and brings you in only to verify it is you."],
    });
  }
  return items;
}

export function missedPaymentFaq(): FaqItem[] {
  const [top] = banksBy("lateFeeRefundRate");
  return [
    {
      question: "Which bank is most likely to refund a late fee?",
      answer: ["In our estimates, ", top.shortName, " grants the most refund requests, at ", { stat: top.stats.lateFeeRefundRate }, "."],
    },
    {
      question: "Does asking for a late fee refund work?",
      answer: ["Usually. ", { stat: getMarketStat("market-late-fee-waived") }, " of people who asked to have a late fee waived got it."],
    },
    {
      question: "How much can a credit card late fee be?",
      answer: [
        "For a big issuer, up to ",
        { stat: getMarketStat("market-late-fee-cap-first") },
        " for a first late payment and ",
        { stat: getMarketStat("market-late-fee-cap-repeat") },
        " if you were also late in one of the six billing cycles before.",
      ],
    },
    { question: "When does a missed payment show up on my credit report?", answer: creditReport() },
    { question: "Can my bank raise my rate after one missed payment?", answer: penaltyRate() },
  ];
}

export function lowerAprFaq(): FaqItem[] {
  const [top] = banksBy("typicalAprCut");
  return [
    {
      question: "Does asking for a lower credit card APR work?",
      answer: [
        "Most of the time. ",
        { stat: getMarketStat("market-apr-ask-success") },
        " of cardholders who asked got a lower rate, and the average cut was ",
        { stat: getMarketStat("market-apr-cut") },
        ".",
      ],
    },
    {
      question: "What is the average credit card APR right now?",
      answer: ["On accounts that were charged interest, ", { stat: getMarketStat("market-average-apr") }, "."],
    },
    {
      question: "Which bank gives the biggest rate cut?",
      answer: ["In our estimates, ", top.shortName, ", at about ", { stat: top.stats.typicalAprCut }, " when it says yes."],
    },
    {
      question: "Will asking for a lower rate hurt my credit?",
      answer: [
        "A rate request is usually a phone call, not a new application, so it does not normally need a hard credit check. Haggle asks the bank before accepting anything that does.",
      ],
    },
  ];
}

export { DATASET_AS_OF };
