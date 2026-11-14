import type { MetadataRoute } from "next";
import { DATASET_AS_OF } from "@/lib/benchmarks";
import { INSIGHTS_PATHS, siteUrl } from "@/lib/benchmarks/site";
import { DIRECTORY_AS_OF, ISSUERS } from "@/lib/directory";
import { phoneIndexPath, phonePath } from "@/lib/directory/locale";

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
    // The phone directory exists in English and Spanish; each entry names its other language.
    ...(["en", "es"] as const).flatMap((lang) => [
      {
        url: `${base}${phoneIndexPath(lang)}`,
        lastModified: DIRECTORY_AS_OF,
        changeFrequency: "monthly" as const,
        priority: 0.9,
        alternates: { languages: { "en-US": `${base}${phoneIndexPath("en")}`, "es-US": `${base}${phoneIndexPath("es")}` } },
      },
      ...ISSUERS.map((issuer) => ({
        url: `${base}${phonePath(issuer, lang)}`,
        lastModified: issuer.checkedOn,
        changeFrequency: "monthly" as const,
        priority: 0.8,
        alternates: { languages: { "en-US": `${base}${phonePath(issuer, "en")}`, "es-US": `${base}${phonePath(issuer, "es")}` } },
      })),
    ]),
  ];
}
