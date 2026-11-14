import { PAGE_IMAGE_SIZE, renderPageImage } from "@/components/insights/og/render";
import { getMarketStat } from "@/lib/benchmarks";
import { localizeStat } from "@/lib/benchmarks/locale";

export const alt = "Calculadora de intereses de tarjetas de crédito";
export const size = PAGE_IMAGE_SIZE;
export const contentType = "image/png";

export default function Image() {
  return renderPageImage({
    eyebrow: "Calculadora",
    title: "¿Cuánto te cuesta tu tarjeta y cuánto ahorrarías con una tasa más baja?",
    stats: ["market-average-apr", "market-apr-ask-success", "market-apr-cut"].map((id) => localizeStat(getMarketStat(id), "es")),
    lang: "es",
  });
}
