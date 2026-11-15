"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Bell, ChartColumn, CreditCard, Layers, LayoutGrid, Phone, type LucideIcon } from "lucide-react";
import { LocaleSwitch } from "@/components/i18n/locale-switch";
import { HgLogo } from "@/components/landing-v2/ui";
import { useLocale } from "@/lib/i18n/use-locale";
import { cn } from "@/lib/utils";
import { NAV_ITEMS, type NavId } from "./nav";
import type { ShellData } from "./shell-model";
import { SHELL_COPY } from "./site-copy";

const ICONS: Record<NavId, LucideIcon> = {
  overview: LayoutGrid,
  cards: CreditCard,
  calls: Phone,
  plan: Layers,
  savings: ChartColumn,
  alerts: Bell,
};

const caption = "text-[13px] leading-[18px] font-semibold tracking-[-0.002em]";

/** The sidebar's contents: logo, nav, the missed-payment way in, and who the case belongs to. */
export function SidebarContent({
  active,
  onMissed,
  data,
  onNavigate,
  header,
}: {
  active: NavId | null;
  /** The visitor is on /missed. */
  onMissed: boolean;
  /** null until the case and the clock are read in the browser. */
  data: ShellData | null;
  /** Called when a link is followed, so the mobile menu can close. */
  onNavigate?: () => void;
  /** Replaces the logo row (the mobile menu puts its close button there). */
  header?: React.ReactNode;
}) {
  const alertCount = data?.alertCount ?? 0;
  const copy = SHELL_COPY[useLocale()];
  return (
    <div className="flex h-full flex-col gap-1">
      <div className="flex items-center justify-between gap-2 px-1.5 pb-[18px]">{header ?? <HgLogo />}</div>

      <nav aria-label={copy.navLabel}>
        <ul className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const Icon = ICONS[item.id];
            const current = item.id === active;
            return (
              <li key={item.id}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={current ? "page" : undefined}
                  className={cn(
                    "group flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-[14px] leading-5 font-medium tracking-[-0.005em] transition-colors duration-200",
                    current
                      ? "bg-hg-blue text-white shadow-[0_8px_20px_-12px_rgb(47_107_255/0.9)]"
                      : "text-hg-ink-2 hover:bg-hg-surface hover:text-hg-ink",
                  )}
                >
                  <Icon
                    className={cn(
                      "size-4 shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
                      !current && "group-hover:scale-110",
                    )}
                    strokeWidth={2.1}
                    aria-hidden
                  />
                  <span className="flex-1">{copy.nav[item.id]}</span>
                  {item.id === "alerts" && alertCount > 0 && (
                    <>
                      <span
                        aria-hidden
                        className={cn(
                          "tabular inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] leading-none font-bold",
                          current ? "bg-white text-hg-blue" : "bg-hg-blue text-white shadow-[0_4px_10px_-4px_rgb(47_107_255/0.8)]",
                        )}
                      >
                        {alertCount > 99 ? "99+" : alertCount}
                      </span>
                      <span className="sr-only">{copy.openCount(alertCount)}</span>
                    </>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <Link
        href="/missed"
        onClick={onNavigate}
        aria-current={onMissed ? "page" : undefined}
        className={cn(
          "group relative mt-6 flex min-h-[112px] flex-col gap-1 overflow-hidden rounded-[20px] bg-linear-135 from-[#2b3446] to-hg-ink to-72% p-3.5 transition-shadow duration-300 hover:shadow-[0_16px_32px_-18px_rgb(11_18_32/0.9)]",
          onMissed && "ring-2 ring-hg-blue ring-offset-2",
        )}
      >
        <Image
          src="/app/3d/hourglass-3d.png"
          alt=""
          aria-hidden
          width={62}
          height={94}
          className="pointer-events-none absolute top-8 -right-2 h-[94px] w-[62px] max-w-none transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-rotate-6"
        />
        <span className={cn(caption, "relative flex w-[150px] items-center justify-between text-[#a9c6ff]")}>
          {copy.missedTitle}
          <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
        </span>
        <span className="relative max-w-[140px] text-[13px] leading-[18px] font-medium text-white/68">{copy.missedLead}</span>
      </Link>

      <div className="flex-1" />

      <LocaleSwitch className="mb-2 self-start bg-hg-surface" />

      <div className="flex w-full items-center gap-2.5 rounded-[14px] bg-hg-surface p-2.5">
        <span aria-hidden className={cn(caption, "flex size-8 shrink-0 items-center justify-center rounded-full bg-hg-blue text-white")}>
          {data?.initial ?? ""}
        </span>
        <div className={cn(caption, "flex min-w-0 flex-col")}>
          {data ? (
            <span className="truncate text-hg-ink">{data.name ?? copy.welcome}</span>
          ) : (
            <span aria-hidden className="hg-shimmer my-0.5 block h-3.5 w-16 rounded-md" />
          )}
          <span className="text-hg-muted">{copy.plan}</span>
        </div>
      </div>
    </div>
  );
}
