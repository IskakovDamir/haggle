import { PAGE_IMAGE_SIZE, renderPageImage } from "@/components/insights/og/render";
import { getMarketStat } from "@/lib/benchmarks";
import { localizeStat } from "@/lib/benchmarks/locale";

export const alt = "Cómo conseguir un APR más bajo en tu tarjeta, banco por banco";
export const size = PAGE_IMAGE_SIZE;
export const contentType = "image/png";

export default function Image() {
  return renderPageImage({
    eyebrow: "Bajar la tasa",
    title: "Cómo conseguir un APR más bajo, banco por banco",
    stats: ["market-apr-ask-success", "market-apr-cut", "market-average-apr"].map((id) => localizeStat(getMarketStat(id), "es")),
    lang: "es",
  });
}
