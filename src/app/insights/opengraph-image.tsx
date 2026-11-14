import { renderPageImage, PAGE_IMAGE_SIZE } from "@/components/insights/og/render";
import { getMarketStat } from "@/lib/benchmarks";

export const alt = "Credit card benchmarks by bank, with every number sourced";
export const size = PAGE_IMAGE_SIZE;
export const contentType = "image/png";

export default function Image() {
  return renderPageImage({
    eyebrow: "Insights",
    title: "Most people who ask their bank for a lower rate get one",
    stats: ["market-apr-ask-success", "market-apr-cut", "market-late-fee-waived"].map(getMarketStat),
  });
}
