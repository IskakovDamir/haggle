import { notFound } from "next/navigation";
import { PAGE_IMAGE_SIZE, renderPhoneImage } from "@/components/insights/og/render";
import { formatDate } from "@/lib/format";
import { ISSUERS, getIssuer, mainLine } from "@/lib/directory";
import { localizeIssuer, serviceNameFor } from "@/lib/directory/locale";

export const alt = "Teléfono oficial de servicio al cliente de la tarjeta de crédito";
export const size = PAGE_IMAGE_SIZE;
export const contentType = "image/png";

export function generateStaticParams() {
  return ISSUERS.map((issuer) => ({ issuer: issuer.slug }));
}

export default async function Image({ params }: { params: Promise<{ issuer: string }> }) {
  const found = getIssuer((await params).issuer);
  if (!found) notFound();
  const issuer = localizeIssuer(found, "es");
  const line = mainLine(issuer);
  return renderPhoneImage({
    title: serviceNameFor(issuer, "es"),
    label: line.label,
    number: line.display,
    checked: `Verificado el ${formatDate(issuer.checkedOn, "es")} en ${issuer.source.name}`,
    eyebrow: "Teléfonos",
  });
}
