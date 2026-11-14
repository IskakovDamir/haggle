// Pieces of the phone directory pages, in the landing's Figma style.
import Link from "next/link";
import { BlobPanel } from "@/components/landing-v2/pricing-panel";
import { SourceLink } from "@/components/insights/provenance";
import { formatDate } from "@/lib/format";
import { directoryPath, mainLine, telHref } from "@/lib/directory";
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
export function CheckedOn({ issuer, tone = "light" }: { issuer: Issuer; tone?: "light" | "dark" }) {
  return (
    <span className={tone === "light" ? "text-hg-muted" : "text-white/70"}>
      Checked {formatDate(issuer.checkedOn)} on <SourceLink source={issuer.source} tone={tone} />
    </span>
  );
}

/** Every number the issuer lists, with its hours as printed. */
export function LinesTable({ issuer }: { issuer: Issuer }) {
  return (
    <BlobPanel dir="versus" angle={158.98} bottoms={{ center: -200, left: -130 }} className="p-3 sm:p-7">
      <div role="region" aria-label={`${issuer.name} phone numbers`} tabIndex={0} className="overflow-x-auto rounded-[28px] border border-white bg-white/94">
        <table className="w-full min-w-[560px]">
          <caption className="sr-only">{`${issuer.name} customer service phone numbers`}</caption>
          <thead>
            <tr>
              <th scope="col" className={cn("px-6 py-4", caption)}>
                What it is for
              </th>
              <th scope="col" className={cn("px-5 py-4", caption)}>
                Number
              </th>
              <th scope="col" className={cn("px-5 py-4", caption)}>
                Hours
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
                <td className="px-5 py-5 text-[15px] leading-6 font-medium text-hg-ink-2">{line.hours ?? "Not listed on the official page"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="border-t border-hg-line px-6 py-4 text-[13px] leading-[18px] font-medium">
          <CheckedOn issuer={issuer} />
        </p>
      </div>
    </BlobPanel>
  );
}

/** The A to Z list of issuers with their main card number. */
export function DirectoryTable({ issuers }: { issuers: Issuer[] }) {
  return (
    <BlobPanel dir="versus" angle={158.98} bottoms={{ center: -200, left: -130 }} className="p-3 sm:p-7">
      <div role="region" aria-label="Credit card phone numbers by issuer" tabIndex={0} className="overflow-x-auto rounded-[28px] border border-white bg-white/94">
        <table className="w-full min-w-[640px]">
          <caption className="sr-only">Credit card customer service phone numbers by issuer</caption>
          <thead>
            <tr>
              <th scope="col" className={cn("px-6 py-4", caption)}>
                Card issuer
              </th>
              <th scope="col" className={cn("px-5 py-4", caption)}>
                Card customer service
              </th>
              <th scope="col" className={cn("px-5 py-4", caption)}>
                Hours
              </th>
              <th scope="col" className={cn("px-5 py-4", caption)}>
                Official source
              </th>
            </tr>
          </thead>
          <tbody>
            {issuers.map((issuer) => {
              const line = mainLine(issuer);
              return (
                <tr key={issuer.slug} className="border-t border-hg-line">
                  <th scope="row" className="px-6 py-5 text-left text-[17px] leading-6 font-semibold tracking-[-0.01em] whitespace-nowrap text-hg-ink">
                    <Link href={directoryPath(issuer)} className="transition-colors hover:text-hg-blue">
                      {issuer.name}
                    </Link>
                  </th>
                  <td className="px-5 py-5 text-[17px] leading-6 font-semibold whitespace-nowrap text-hg-ink">
                    <PhoneNumber line={line} />
                  </td>
                  <td className="px-5 py-5 text-[14px] leading-5 font-medium text-hg-ink-2">{line.hours ?? "Not listed"}</td>
                  <td className="px-5 py-5 text-[13px] leading-[18px] font-medium">
                    <SourceLink source={issuer.source} />
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
