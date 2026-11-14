import type { MetadataRoute } from "next";
import { DATASET_AS_OF } from "@/lib/benchmarks";
import { INSIGHTS_PATHS, siteUrl } from "@/lib/benchmarks/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  return [
    { url: base, changeFrequency: "weekly", priority: 1 },
    ...INSIGHTS_PATHS.map((path) => ({
      url: `${base}${path}`,
      lastModified: DATASET_AS_OF,
      changeFrequency: "monthly" as const,
      priority: path === "/insights" ? 0.9 : 0.8,
    })),
  ];
}
