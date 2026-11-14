// GET /api/og/stat?id=<statId>[&format=portrait]: one number from the benchmark dataset as a post image.
// 1200x630 by default, 1080x1350 with format=portrait. Unknown ids get a 404 with the list of valid ones.
import type { NextRequest } from "next/server";
import { renderStatImage } from "@/components/insights/og/render";
import { allStats, getStat } from "@/lib/benchmarks";

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id") ?? "";
  const stat = getStat(id);
  if (!stat) {
    return Response.json({ error: "Unknown stat id", ids: allStats().map((s) => s.id) }, { status: 404 });
  }
  const format = request.nextUrl.searchParams.get("format") === "portrait" ? "portrait" : "landscape";
  const image = await renderStatImage(stat, format);
  image.headers.set("Cache-Control", "public, max-age=86400, s-maxage=86400");
  return image;
}
