import { renderPageImage, PAGE_IMAGE_SIZE } from "@/components/insights/og/render";
import { banksBy, getMarketStat } from "@/lib/benchmarks";

export const alt = "Missed a credit card payment? How to get the late fee back";
export const size = PAGE_IMAGE_SIZE;
export const contentType = "image/png";

export default function Image() {
  const [top] = banksBy("lateFeeRefundRate");
  return renderPageImage({
    eyebrow: "Missed payment",
    title: "Missed a payment? Most people who ask get the late fee back",
    stats: [getMarketStat("market-late-fee-waived"), getMarketStat("market-late-fee-cap-first"), top.stats.lateFeeRefundRate],
  });
}
