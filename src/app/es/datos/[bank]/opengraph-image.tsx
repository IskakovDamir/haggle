import { notFound } from "next/navigation";
import { PAGE_IMAGE_SIZE, renderPageImage } from "@/components/insights/og/render";
import { BANKS, getBank } from "@/lib/benchmarks";
import { localizeBank } from "@/lib/benchmarks/locale";

export const alt = "Cargos por atraso, devoluciones y reducciones de tasa en este banco";
export const size = PAGE_IMAGE_SIZE;
export const contentType = "image/png";

export function generateStaticParams() {
  return BANKS.map((bank) => ({ bank: bank.slug }));
}

export default async function Image({ params }: { params: Promise<{ bank: string }> }) {
  const found = getBank((await params).bank);
  if (!found) notFound();
  const bank = localizeBank(found, "es");
  return renderPageImage({
    eyebrow: bank.name,
    title: `¿Te atrasaste en un pago con ${bank.shortName}? Qué pasa y cómo recuperar el cargo`,
    stats: [bank.stats.lateFeeRefundRate, bank.stats.typicalAprCut, bank.stats.satisfaction],
    lang: "es",
  });
}
