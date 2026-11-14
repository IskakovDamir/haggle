// Pieces of the phone directory pages, in the landing's Figma style.
import Link from "next/link";
import { BlobPanel } from "@/components/landing-v2/pricing-panel";
import { SourceLink } from "@/components/insights/provenance";
import { formatDate } from "@/lib/format";
import { mainLine, telHref } from "@/lib/directory";
import { phonePath } from "@/lib/directory/locale";
import type { Locale } from "@/lib/i18n/locale";
import type { Issuer, PhoneLine } from "@/lib/directory/types";
import { cn } from "@/lib/utils";

const caption = "text-left text-[13px] leading-[18px] font-semibold tracking-[-0.002em] text-hg-muted";

export function PhoneNumber({ line, className }: { line: PhoneLine; className?: string }) {
  return (
    <a href={telHref(line.display)} className={cn("tabular-nums transition-colors hover:text-hg-blue", className)}>
      {line.display}
    </a>
  );
}

/** "Checked Nov 15, 2026 on chase.com" with the link to the page the number was read from. */
export function CheckedOn({ issuer, tone = "light", lang = "en" }: { issuer: Issuer; tone?: "light" | "dark"; lang?: Locale }) {
  return (
    <span className={tone === "light" ? "text-hg-muted" : "text-white/70"}>
      {lang === "es" ? "Verificado el " : "Checked "}
      {formatDate(issuer.checkedOn, lang)} {lang === "es" ? "en" : "on"} <SourceLink source={issuer.source} tone={tone} />
    </span>
  );
}

/** Every number the issuer lists, with its hours as printed. */
const TABLE_COPY = {
  en: { lines: (name: string) => `${name} phone numbers`, purpose: "What it is for", number: "Number", hours: "Hours", notListed: "Not listed on the official page", notListedShort: "Not listed", issuer: "Card issuer", main: "Card customer service", source: "Official source", byIssuer: "Credit card phone numbers by issuer" },
  es: { lines: (name: string) => `Teléfonos de ${name}`, purpose: "Para qué es", number: "Número", hours: "Horario", notListed: "No aparece en la página oficial", notListedShort: "No aparece", issuer: "Emisor de la tarjeta", main: "Servicio al cliente de la tarjeta", source: "Fuente oficial", byIssuer: "Teléfonos de tarjetas de crédito por emisor" },
} as const;

export function LinesTable({ issuer, lang = "en" }: { issuer: Issuer; lang?: Locale }) {
  const t = TABLE_COPY[lang];
  return (
    <BlobPanel dir="versus" angle={158.98} bottoms={{ center: -200, left: -130 }} className="p-3 sm:p-7">
      <div role="region" aria-label={t.lines(issuer.name)} tabIndex={0} className="overflow-x-auto rounded-[28px] border border-white bg-white/94">
        <table className="w-full min-w-[560px]">
          <caption className="sr-only">{t.lines(issuer.name)}</caption>
          <thead>
            <tr>
              <th scope="col" className={cn("px-6 py-4", caption)}>
                {t.purpose}
              </th>
              <th scope="col" className={cn("px-5 py-4", caption)}>
                {t.number}
              </th>
              <th scope="col" className={cn("px-5 py-4", caption)}>
                {t.hours}
              </th>
            </tr>
          </thead>
          <tbody>
            {issuer.lines.map((line) => (
              <tr key={line.display} className="border-t border-hg-line">
                <th scope="row" className="px-6 py-5 text-left text-[16px] leading-6 font-semibold tracking-[-0.01em] text-hg-ink">
                  {line.label}
                  {line.note && <span className="mt-1 block text-[13px] leading-[18px] font-medium text-hg-muted">{line.note}</span>}
                </th>
                <td className="px-5 py-5 text-[17px] leading-6 font-semibold whitespace-nowrap text-hg-ink">
                  <PhoneNumber line={line} />
                </td>
                <td className="px-5 py-5 text-[15px] leading-6 font-medium text-hg-ink-2">{line.hours ?? t.notListed}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="border-t border-hg-line px-6 py-4 text-[13px] leading-[18px] font-medium">
          <CheckedOn issuer={issuer} lang={lang} />
        </p>
      </div>
    </BlobPanel>
  );
}

/** The A to Z list of issuers with their main card number. */
export function DirectoryTable({ issuers, lang = "en" }: { issuers: Issuer[]; lang?: Locale }) {
  const t = TABLE_COPY[lang];
  return (
    <BlobPanel dir="versus" angle={158.98} bottoms={{ center: -200, left: -130 }} className="p-3 sm:p-7">
      <div role="region" aria-label={t.byIssuer} tabIndex={0} className="overflow-x-auto rounded-[28px] border border-white bg-white/94">
        <table className="w-full sm:min-w-[640px]">
          <caption className="sr-only">{t.byIssuer}</caption>
          <thead>
            <tr>
              <th scope="col" className={cn("px-4 py-4 sm:px-6", caption)}>
                {t.issuer}
              </th>
              <th scope="col" className={cn("px-4 py-4 sm:px-5", caption)}>
                {t.main}
              </th>
              <th scope="col" className={cn("hidden px-5 py-4 sm:table-cell", caption)}>
                {t.hours}
              </th>
              <th scope="col" className={cn("hidden px-5 py-4 sm:table-cell", caption)}>
                {t.source}
              </th>
            </tr>
          </thead>
          <tbody>
            {issuers.map((issuer) => {
              const line = mainLine(issuer);
              return (
                <tr key={issuer.slug} className="border-t border-hg-line">
                  <th scope="row" className="px-4 py-5 text-left text-[16px] leading-6 font-semibold tracking-[-0.01em] text-hg-ink sm:px-6 sm:text-[17px] sm:whitespace-nowrap">
                    <Link href={phonePath(issuer, lang)} className="transition-colors hover:text-hg-blue">
                      {issuer.name}
                    </Link>
                  </th>
                  <td className="px-4 py-5 text-[16px] leading-6 font-semibold whitespace-nowrap text-hg-ink sm:px-5 sm:text-[17px]">
                    <PhoneNumber line={line} />
                  </td>
                  <td className="hidden px-5 py-5 text-[14px] leading-5 font-medium text-hg-ink-2 sm:table-cell">{line.hours ?? t.notListedShort}</td>
                  <td className="hidden px-5 py-5 text-[13px] leading-[18px] font-medium sm:table-cell">
                    <SourceLink source={issuer.source} lang={lang} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </BlobPanel>
  );
}

/** A short script with blanks in brackets. No invented reasons: the caller fills in only what is true. */
export function Script({ title, lines, note }: { title: string; lines: string[]; note: string }) {
  return (
    <div className="flex flex-col gap-4 rounded-[28px] bg-hg-surface p-7">
      <p className="text-[17px] leading-6 font-semibold tracking-[-0.01em] text-hg-ink">{title}</p>
      <div className="flex flex-col gap-3 border-l-2 border-hg-blue-tint pl-4">
        {lines.map((line) => (
          <p key={line} className="text-[16px] leading-[26px] font-medium text-hg-ink-2">
            {line}
          </p>
        ))}
      </div>
      <p className="text-[14px] leading-[22px] font-medium text-hg-muted">{note}</p>
    </div>
  );
}
