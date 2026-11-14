import { renderPageImage, PAGE_IMAGE_SIZE } from "@/components/insights/og/render";
import { getMarketStat } from "@/lib/benchmarks";

export const alt = "How to get a lower credit card APR, bank by bank";
export const size = PAGE_IMAGE_SIZE;
export const contentType = "image/png";

export default function Image() {
  return renderPageImage({
    eyebrow: "Lower APR",
    title: "How to get a lower credit card APR, bank by bank",
    stats: ["market-apr-ask-success", "market-apr-cut", "market-average-apr"].map(getMarketStat),
  });
}
