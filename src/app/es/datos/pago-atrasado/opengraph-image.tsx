import { PAGE_IMAGE_SIZE, renderPageImage } from "@/components/insights/og/render";
import { banksBy, getMarketStat } from "@/lib/benchmarks";
import { localizeStat } from "@/lib/benchmarks/locale";

export const alt = "¿Te atrasaste en un pago de tu tarjeta? Cómo recuperar el cargo";
export const size = PAGE_IMAGE_SIZE;
export const contentType = "image/png";

export default function Image() {
  const [top] = banksBy("lateFeeRefundRate");
  return renderPageImage({
    eyebrow: "Pago atrasado",
    title: "¿Te atrasaste en un pago? La mayoría recupera el cargo si lo pide",
    stats: [getMarketStat("market-late-fee-waived"), getMarketStat("market-late-fee-cap-first"), top.stats.lateFeeRefundRate].map((s) => localizeStat(s, "es")),
    lang: "es",
  });
}
