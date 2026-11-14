// FAQ for the calculator page. Cited numbers carry their source; the worked example is computed by the engine.
import { getMarketStat } from "@/lib/benchmarks";
import type { FaqItem } from "@/lib/benchmarks/faq";
import { formatPoints } from "@/lib/format";
import { formatDollars } from "@/lib/money";
import { calculate, defaultInput, minimumPaymentRule } from "./model";

export function calculatorFaq(): FaqItem[] {
  const example = defaultInput();
  const worked = calculate(example);
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
        { stat: getMarketStat("market-apr-ask-success") },
        " of cardholders who asked for a lower rate got one, and the average cut was ",
        { stat: getMarketStat("market-apr-cut") },
        `. Calculated with this tool, a ${formatPoints(example.cutBps)}-point cut on a ${formatDollars(example.balanceCents)} balance saves ${formatDollars(worked.yearSavedCents)} in the first year.`,
      ],
    },
    {
      question: "What is the average credit card APR right now?",
      answer: ["On accounts that were charged interest, ", { stat: getMarketStat("market-average-apr") }, "."],
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
