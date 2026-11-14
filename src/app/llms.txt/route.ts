// GET /llms.txt: a plain summary of Haggle and its insights pages for AI search (llmstxt.org format).
import { BANKS, DATASET_AS_OF, formatStatValue, getMarketStat, provenanceText } from "@/lib/benchmarks";
import { siteUrl } from "@/lib/benchmarks/site";

function line(id: string): string {
  const stat = getMarketStat(id);
  return `${formatStatValue(stat)} ${stat.label} (${provenanceText(stat)}, ${stat.source?.url ?? ""})`;
}

export function GET() {
  const base = siteUrl();
  const body = `# Haggle

> Haggle is an AI agent on the borrower's side. It calls your credit card issuer, waits on hold, and asks for a lower interest rate or a refund of a late fee. It says it is an AI assistant, the cardholder joins to verify identity, and you pay only after the bank says yes.

Haggle covers two use cases:

- Missed a payment: Haggle calls the bank to ask for the late fee back and for the old rate, if the bank raised it. Start at ${base}/missed
- Rate too high: Haggle reads your statement, works out what a lower rate is worth, and calls the bank to ask for it. Start at ${base}/start

In the current demo build, calls are practice calls: the visitor plays the bank's representative. Calls to real banks are the next step.

Data on the insights pages was checked against its sources on ${DATASET_AS_OF}. Each number is labelled as cited from a public source or as a Haggle estimate. Key cited figures:

- ${line("market-apr-ask-success")}
- ${line("market-apr-cut")}
- ${line("market-late-fee-waived")}
- ${line("market-average-apr")}

## Insights

- [Credit card benchmarks](${base}/insights): market figures and a table of five banks, with every number sourced or labelled as an estimate.
- [Missed a credit card payment](${base}/insights/missed-payment): what happens after a missed payment and which banks refund late fees most often.
- [Lower credit card APR](${base}/insights/lower-apr): how often asking for a lower rate works and how big a cut each bank tends to give.
${BANKS.map((bank) => `- [${bank.name}](${base}/insights/${bank.slug}): late fees, refunds, rate cuts, wait times and the phone menu at ${bank.name}.`).join("\n")}

## Optional

- [Home](${base}/): what Haggle does and how pricing works.
`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
