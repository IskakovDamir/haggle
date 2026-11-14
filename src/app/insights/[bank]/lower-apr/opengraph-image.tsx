import { notFound } from "next/navigation";
import { PAGE_IMAGE_SIZE, renderPageImage } from "@/components/insights/og/render";
import { BANKS, getBank, getMarketStat } from "@/lib/benchmarks";
import { localizeBank, localizeStat } from "@/lib/benchmarks/locale";

export const alt = "How to ask this bank for a lower APR";
export const size = PAGE_IMAGE_SIZE;
export const contentType = "image/png";

export function generateStaticParams() {
  return BANKS.map((bank) => ({ bank: bank.slug }));
}

export default async function Image({ params }: { params: Promise<{ bank: string }> }) {
  const found = getBank((await params).bank);
  if (!found) notFound();
  const bank = localizeBank(found, "en");
  return renderPageImage({
    eyebrow: bank.name,
    title: `How to ask ${bank.shortName} for a lower APR, step by step`,
    stats: [localizeStat(getMarketStat("market-apr-ask-success"), "en"), localizeStat(getMarketStat("market-average-apr"), "en"), bank.stats.typicalAprCut],
    lang: "en",
  });
}
