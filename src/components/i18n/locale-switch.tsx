"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Globe } from "lucide-react";
import { landingPath, type Locale } from "@/lib/i18n/locale";
import { setLocale, useLocale, useRememberLocale } from "@/lib/i18n/use-locale";
import { cn } from "@/lib/utils";

const LABEL: Record<Locale, string> = { en: "EN", es: "ES" };
const NAME: Record<Locale, string> = { en: "English", es: "Español" };

/**
 * The EN / ES pill. On the landing (`landing` set) it links to that language's landing page and
 * remembers the choice; inside the app it switches the language in place.
 */
export function LocaleSwitch({ landing, className }: { landing?: Locale; className?: string }) {
  const router = useRouter();
  const appLocale = useLocale();
  const current = landing ?? appLocale;

  return (
    <div role="group" aria-label="Language / Idioma" className={cn("flex items-center gap-0.5 rounded-full bg-white/60 p-1", className)}>
      {(["en", "es"] as const).map((locale) => {
        const on = locale === current;
        const classes = cn(
          "flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[13px] leading-[18px] font-semibold tracking-[-0.002em] transition-colors",
          on ? "bg-hg-ink text-white" : "text-hg-ink-2 hover:bg-white/70",
        );
        const content = (
          <>
            {on && <Globe className="size-3.5" aria-hidden />}
            {LABEL[locale]}
          </>
        );
        return landing ? (
          <Link
            key={locale}
            href={landingPath(locale)}
            aria-current={on ? "true" : undefined}
            aria-label={NAME[locale]}
            onClick={() => setLocale(locale)}
            className={classes}
          >
            {content}
          </Link>
        ) : (
          <button
            key={locale}
            type="button"
            aria-pressed={on}
            aria-label={NAME[locale]}
            onClick={() => {
              setLocale(locale);
              router.refresh();
            }}
            className={cn(classes, "cursor-pointer")}
          >
            {content}
          </button>
        );
      })}
    </div>
  );
}

/** Put on a page that exists in one language only, so the app follows the visitor into it. */
export function RememberLocale({ locale }: { locale: Locale }) {
  useRememberLocale(locale);
  return null;
}
