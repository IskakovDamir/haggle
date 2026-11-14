import type { MetadataRoute } from "next";
import { DATASET_AS_OF } from "@/lib/benchmarks";
import { BANKS } from "@/lib/benchmarks";
import { calculatorPath, insightsBankPath, insightsIndexPath, insightsTopicPath } from "@/lib/benchmarks/locale";
import { siteUrl } from "@/lib/benchmarks/site";
import { DIRECTORY_AS_OF, ISSUERS } from "@/lib/directory";
import { phoneIndexPath, phonePath } from "@/lib/directory/locale";

/** [English path, Spanish path] for every insights page and the calculator. */
function insightsPairs(): [string, string][] {
  return [
    [insightsIndexPath("en"), insightsIndexPath("es")],
    [insightsTopicPath("missed-payment", "en"), insightsTopicPath("missed-payment", "es")],
    [insightsTopicPath("lower-apr", "en"), insightsTopicPath("lower-apr", "es")],
    ...BANKS.map((b): [string, string] => [insightsBankPath(b.slug, "en"), insightsBankPath(b.slug, "es")]),
    [calculatorPath("en"), calculatorPath("es")],
  ];
}

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  return [
    { url: base, changeFrequency: "weekly", priority: 1 },
    // Insights and the calculator exist in English and Spanish; each entry names its other language.
    ...insightsPairs().flatMap(([en, es]) =>
      [en, es].map((path) => ({
        url: `${base}${path}`,
        lastModified: DATASET_AS_OF,
        changeFrequency: "monthly" as const,
        priority: path === en && path === "/insights" ? 0.9 : 0.8,
        alternates: { languages: { "en-US": `${base}${en}`, "es-US": `${base}${es}` } },
      })),
    ),
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
