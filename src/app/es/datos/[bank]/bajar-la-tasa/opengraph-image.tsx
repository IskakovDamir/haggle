import { notFound } from "next/navigation";
import { PAGE_IMAGE_SIZE, renderPageImage } from "@/components/insights/og/render";
import { BANKS, getBank, getMarketStat } from "@/lib/benchmarks";
import { localizeBank, localizeStat } from "@/lib/benchmarks/locale";

export const alt = "Cómo pedirle a este banco un APR más bajo";
export const size = PAGE_IMAGE_SIZE;
export const contentType = "image/png";

export function generateStaticParams() {
  return BANKS.map((bank) => ({ bank: bank.slug }));
}

export default async function Image({ params }: { params: Promise<{ bank: string }> }) {
  const found = getBank((await params).bank);
  if (!found) notFound();
  const bank = localizeBank(found, "es");
  return renderPageImage({
    eyebrow: bank.name,
    title: `Cómo pedirle a ${bank.shortName} un APR más bajo, paso a paso`,
    stats: [localizeStat(getMarketStat("market-apr-ask-success"), "es"), localizeStat(getMarketStat("market-average-apr"), "es"), bank.stats.typicalAprCut],
    lang: "es",
  });
}
