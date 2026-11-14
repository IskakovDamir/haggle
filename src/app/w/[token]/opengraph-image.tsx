import { LANDSCAPE, renderWinCard } from "@/components/share/card-image";
import { sharedCard } from "@/lib/share/read";

export const alt = "A Haggle win card: what the bank granted and what it saves";
export const size = LANDSCAPE;
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ token: string }> }) {
  const card = await sharedCard((await params).token);
  if (!card) return new Response("Not found", { status: 404 });
  return renderWinCard(card.payload, card.status, card.domain, "landscape");
}
