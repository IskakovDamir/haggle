import { PAGE_IMAGE_SIZE, renderPageImage } from "@/components/insights/og/render";
import { getMarketStat } from "@/lib/benchmarks";

export const alt = "Credit card customer service phone numbers, checked at the source";
export const size = PAGE_IMAGE_SIZE;
export const contentType = "image/png";

export default function Image() {
  return renderPageImage({
    eyebrow: "Phone numbers",
    title: "Credit card phone numbers, checked on each bank's own site",
    stats: ["market-late-fee-waived", "market-apr-ask-success", "market-apr-cut"].map(getMarketStat),
  });
}
