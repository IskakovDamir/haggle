import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/benchmarks/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: ["/", "/insights/", "/phone/", "/tools/", "/es/", "/llms.txt"] },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
