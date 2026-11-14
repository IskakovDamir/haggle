// GET /w/<token>/story: the win card as a 1080x1920 image for stories. ?download=1 saves it as a file.
import { renderWinCard } from "@/components/share/card-image";
import { sharedCard } from "@/lib/share/read";

export async function GET(request: Request, ctx: RouteContext<"/w/[token]/story">) {
  const card = await sharedCard((await ctx.params).token);
  if (!card) return new Response("Not found", { status: 404 });
  const image = await renderWinCard(card.payload, card.status, card.domain, "story");
  if (new URL(request.url).searchParams.get("download")) {
    const slug = card.payload.bank.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    image.headers.set("Content-Disposition", `attachment; filename="haggle-win-${slug}.png"`);
  }
  return image;
}
