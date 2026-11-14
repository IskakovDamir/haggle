// Where the content pages send people to use Haggle. One place, so going live is a one-line change.
//
// Empty until the product is deployed: every call to action then renders as "Launching soon" and links nowhere.
// Set it to the product's origin, for example "https://app.haggle.com", with no trailing slash.
export const PRODUCT_URL = "";

/** The full product link for a path such as "/missed?bank=chase", or null while PRODUCT_URL is empty. */
export function productHref(path: string, base: string = PRODUCT_URL): string | null {
  if (!base) return null;
  return `${base.replace(/\/+$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}
