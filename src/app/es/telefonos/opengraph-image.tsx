import { PAGE_IMAGE_SIZE, renderPhoneImage } from "@/components/insights/og/render";
import { ISSUERS } from "@/lib/directory";

export const alt = "Teléfonos de tarjetas de crédito, verificados en la fuente";
export const size = PAGE_IMAGE_SIZE;
export const contentType = "image/png";

export default function Image() {
  return renderPhoneImage({
    title: "Teléfonos de tarjetas de crédito, verificados en la fuente",
    label: "Bancos y tarjetas de tiendas",
    number: `${ISSUERS.length} emisores`,
    checked: "Cada número, tomado del sitio oficial del emisor",
    eyebrow: "Teléfonos",
  });
}
