import { notFound } from "next/navigation";
import { renderPageImage, PAGE_IMAGE_SIZE } from "@/components/insights/og/render";
import { BANKS, getBank } from "@/lib/benchmarks";

export const alt = "Late fees, refunds and rate cuts at this bank";
export const size = PAGE_IMAGE_SIZE;
export const contentType = "image/png";

export function generateStaticParams() {
  return BANKS.map((bank) => ({ bank: bank.slug }));
}

export default async function Image({ params }: { params: Promise<{ bank: string }> }) {
  const bank = getBank((await params).bank);
  if (!bank) notFound();
  return renderPageImage({
    eyebrow: bank.name,
    title: `Missed a ${bank.shortName} payment? What happens and how to get the fee back`,
    stats: [bank.stats.lateFeeRefundRate, bank.stats.typicalAprCut, bank.stats.satisfaction],
  });
}
