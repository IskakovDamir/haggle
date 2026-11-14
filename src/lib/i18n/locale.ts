// The site's two languages. The landing has one route per language ("/" and "/es"); app screens read
// the visitor's choice from the browser, set when they visit "/es" or use the EN/ES switch.
// Safe to import anywhere: the hooks live in ./use-locale.ts.

export type Locale = "en" | "es";

export const LOCALES: readonly Locale[] = ["en", "es"];
export const DEFAULT_LOCALE: Locale = "en";

export function isLocale(value: unknown): value is Locale {
  return value === "en" || value === "es";
}

/** The landing page for a language. */
export function landingPath(locale: Locale): string {
  return locale === "es" ? "/es" : "/";
}

/** BCP 47 tag for the html lang attribute and number formats. */
export const LANGUAGE_TAG: Record<Locale, string> = { en: "en-US", es: "es-US" };

/** A copy table: the same keys in every language, so a missing translation fails the type check. */
export type Copy<T> = Record<Locale, T>;
