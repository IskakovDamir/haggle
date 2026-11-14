import { notFound } from "next/navigation";
import { PAGE_IMAGE_SIZE, renderPhoneImage } from "@/components/insights/og/render";
import { formatDate } from "@/lib/format";
import { ISSUERS, getIssuer, mainLine } from "@/lib/directory";
import { serviceNameFor } from "@/lib/directory/locale";

export const alt = "Official credit card customer service phone number";
export const size = PAGE_IMAGE_SIZE;
export const contentType = "image/png";

export function generateStaticParams() {
  return ISSUERS.map((issuer) => ({ issuer: issuer.slug }));
}

export default async function Image({ params }: { params: Promise<{ issuer: string }> }) {
  const issuer = getIssuer((await params).issuer);
  if (!issuer) notFound();
  const line = mainLine(issuer);
  return renderPhoneImage({
    title: serviceNameFor(issuer, "en"),
    label: line.label,
    number: line.display,
    checked: `Checked ${formatDate(issuer.checkedOn)} on ${issuer.source.name}`,
  });
}
