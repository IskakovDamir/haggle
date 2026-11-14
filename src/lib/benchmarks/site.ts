// The public origin for canonical URLs, the sitemap and llms.txt.
const FALLBACK = "https://haggle-pi.vercel.app";

/** NEXT_PUBLIC_SITE_URL when it is a valid http(s) origin, otherwise the live demo URL. No trailing slash. */
export function siteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL;
  if (!raw) return FALLBACK;
  try {
    const url = new URL(raw);
    return url.protocol === "https:" || url.protocol === "http:" ? url.origin : FALLBACK;
  } catch {
    return FALLBACK;
  }
}

/** Every insights path, in the order they appear in the index. */
export const INSIGHTS_PATHS = [
  "/insights",
  "/insights/missed-payment",
  "/insights/lower-apr",
  "/insights/chase",
  "/insights/capital-one",
  "/insights/citi",
  "/insights/amex",
  "/insights/discover",
] as const;
