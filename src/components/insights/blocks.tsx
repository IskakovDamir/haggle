// Data blocks for the insights pages: the bank comparison table, the missed-payment timeline, the FAQ and JSON-LD.
import Link from "next/link";
import { BlobPanel } from "@/components/landing-v2/pricing-panel";
import { GrowBar } from "@/components/motion/grow";
import { formatStatValue } from "@/lib/benchmarks";
import type { FaqItem, Segment } from "@/lib/benchmarks/faq";
import type { Bank, BankMetric, Stat, TimelineStep } from "@/lib/benchmarks/types";
import type { Locale } from "@/lib/i18n/locale";
import { cn } from "@/lib/utils";
import { InlineStat, Provenance, SourceLink } from "./provenance";

export const METRIC_LABEL: Record<BankMetric, string> = {
  satisfaction: "Satisfaction score",
  waitToPerson: "Wait to a person",
  lateFeeMax: "Highest late fee",
  lateFeeRefundRate: "Late fee refunds granted",
  typicalAprCut: "Typical rate cut",
};

const caption = "text-left text-[13px] leading-[18px] font-semibold tracking-[-0.002em] text-hg-muted";

/** A column's provenance, printed in its header. Every stat in a column shares its kind and source. */
function ColumnLabel({ sample }: { sample: Stat }) {
  return (
    <span className="mt-1 block text-[12px] leading-4 font-medium">
      <Provenance stat={sample} />
    </span>
  );
}

/**
 * Banks compared across the chosen metrics, in the landing's framed table.
 * `highlight` gets a bar under each value, scaled to the largest value in the column.
 */
export function BankTable({
  banks,
  metrics,
  highlight,
  label,
}: {
  banks: Bank[];
  metrics: BankMetric[];
  highlight?: BankMetric;
  label: string;
}) {
  const max = highlight ? Math.max(...banks.map((b) => b.stats[highlight].value)) : 1;
  return (
    <BlobPanel dir="versus" angle={158.98} bottoms={{ center: -200, left: -130 }} className="p-3 sm:p-7">
      <div role="region" aria-label={label} tabIndex={0} className="overflow-x-auto rounded-[28px] border border-white bg-white/94">
        <table className="w-full min-w-[760px]">
          <caption className="sr-only">{label}</caption>
          <thead>
            <tr>
              <th scope="col" className={cn("px-6 py-4 align-bottom", caption)}>
                Bank
              </th>
              {metrics.map((metric) => (
                <th
                  key={metric}
                  scope="col"
                  className={cn("px-5 py-4 align-bottom", caption, metric === highlight && "bg-hg-blue-soft text-hg-ink-2")}
                >
                  {METRIC_LABEL[metric]}
                  <ColumnLabel sample={banks[0].stats[metric]} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {banks.map((bank) => (
              <tr key={bank.slug} className="border-t border-hg-line">
                <th scope="row" className="px-6 py-5 text-left text-[17px] leading-6 font-semibold tracking-[-0.01em] whitespace-nowrap text-hg-ink">
                  <Link href={`/insights/${bank.slug}`} className="transition-colors hover:text-hg-blue">
                    {bank.name}
                  </Link>
                </th>
                {metrics.map((metric) => {
                  const stat = bank.stats[metric];
                  return (
                    <td key={metric} className={cn("px-5 py-5", metric === highlight && "bg-hg-blue-soft")}>
                      <span className="text-[17px] leading-6 font-semibold tracking-[-0.01em] text-hg-ink tabular-nums">{formatStatValue(stat)}</span>
                      {metric === highlight && (
                        <span className="mt-2 block h-1.5 w-full max-w-[140px] overflow-hidden rounded-full bg-white">
                          <GrowBar width={`${Math.round((stat.value / max) * 100)}%`} className="h-1.5 rounded-full bg-hg-blue" />
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </BlobPanel>
  );
}

/** What happens after a missed payment, each step with its source. No numbering: the "when" line orders it. */
export function Timeline({ steps }: { steps: TimelineStep[] }) {
  return (
    <ol className="relative flex flex-col gap-0 border-l-2 border-hg-blue-tint pl-6 sm:pl-8">
      {steps.map((step) => (
        <li key={step.id} className="relative pb-8 last:pb-0">
          <span aria-hidden className="absolute top-1.5 -left-[33px] size-3 rounded-full bg-hg-blue ring-4 ring-white sm:-left-[41px]" />
          <p className="text-[15px] leading-5 font-semibold tracking-[-0.005em] text-hg-blue">{step.when}</p>
          <p className="mt-1.5 max-w-[60ch] text-[17px] leading-7 font-medium tracking-[-0.01em] text-hg-ink">{step.text}</p>
          <p className="mt-1 text-[13px] leading-[18px] font-medium">
            <SourceLink source={step.source} />
          </p>
        </li>
      ))}
    </ol>
  );
}

function Answer({ answer, lang }: { answer: Segment[]; lang: Locale }) {
  return (
    <p className="max-w-[68ch] text-[16px] leading-[26px] font-medium tracking-[-0.005em] text-hg-ink-2">
      {answer.map((part, i) => {
        if (typeof part === "string") return <span key={i}>{part}</span>;
        if ("stat" in part) return <InlineStat key={i} stat={part.stat} lang={lang} />;
        return (
          <span key={i} className="text-[0.8em]">
            {" "}
            (<SourceLink source={part.source} lang={lang} />)
          </span>
        );
      })}
    </p>
  );
}

/** Every question with its answer showing: the page reads fully with no clicks. */
export function FaqList({ items, lang = "en" }: { items: FaqItem[]; lang?: Locale }) {
  return (
    <div className="flex flex-col divide-y divide-hg-line rounded-[28px] border border-hg-line bg-white">
      {items.map((item) => (
        <div key={item.question} className="flex flex-col gap-2 px-6 py-5 sm:px-8 sm:py-6">
          <h3 className="text-[18px] leading-7 font-semibold tracking-[-0.01em] text-hg-ink">{item.question}</h3>
          <Answer answer={item.answer} lang={lang} />
        </div>
      ))}
    </div>
  );
}

/** Structured data, with "<" escaped so a string can never close the script tag. */
export function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
