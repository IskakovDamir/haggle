import type { MetadataRoute } from "next";
import { DATASET_AS_OF } from "@/lib/benchmarks";
import { INSIGHTS_PATHS, siteUrl } from "@/lib/benchmarks/site";
import { DIRECTORY_AS_OF, ISSUERS, directoryPath } from "@/lib/directory";

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
    { url: `${base}/tools/credit-card-interest-calculator`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/phone`, lastModified: DIRECTORY_AS_OF, changeFrequency: "monthly", priority: 0.9 },
    ...ISSUERS.map((issuer) => ({
      url: `${base}${directoryPath(issuer)}`,
      lastModified: issuer.checkedOn,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
