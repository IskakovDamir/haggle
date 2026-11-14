import { PAGE_IMAGE_SIZE, renderPageImage } from "@/components/insights/og/render";
import { getMarketStat } from "@/lib/benchmarks";
import { localizeStat } from "@/lib/benchmarks/locale";

export const alt = "Datos de tarjetas de crédito por banco, con cada número citado";
export const size = PAGE_IMAGE_SIZE;
export const contentType = "image/png";

export default function Image() {
  return renderPageImage({
    eyebrow: "Datos",
    title: "La mayoría de quienes piden una tasa más baja la consiguen",
    stats: ["market-apr-ask-success", "market-apr-cut", "market-late-fee-waived"].map((id) => localizeStat(getMarketStat(id), "es")),
    lang: "es",
  });
}
