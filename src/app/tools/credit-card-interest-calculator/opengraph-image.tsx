import { PAGE_IMAGE_SIZE, renderPageImage } from "@/components/insights/og/render";
import { getMarketStat } from "@/lib/benchmarks";

export const alt = "Credit card interest calculator: see what a lower APR saves";
export const size = PAGE_IMAGE_SIZE;
export const contentType = "image/png";

export default function Image() {
  return renderPageImage({
    eyebrow: "Calculator",
    title: "What does your card cost, and what would a lower rate save?",
    stats: ["market-average-apr", "market-apr-ask-success", "market-apr-cut"].map(getMarketStat),
  });
}
