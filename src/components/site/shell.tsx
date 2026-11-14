"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, Menu, X } from "lucide-react";
import { LocaleSwitch } from "@/components/i18n/locale-switch";
import { HgButton, HgLogo } from "@/components/landing-v2/ui";
import { EASE } from "@/components/motion/reveal";
import { useLocale } from "@/lib/i18n/use-locale";
import { useCaseFile } from "@/lib/store";
import { cn } from "@/lib/utils";
import { activeNav, greetingFor } from "./nav";
import { shellData, type ShellData } from "./shell-model";
import { SHELL_COPY } from "./site-copy";
import { SidebarContent } from "./sidebar";
import { useClock } from "./use-clock";

export function Logo({ className }: { className?: string }) {
  return <HgLogo className={className} />;
}

const caption = "text-[13px] leading-[18px] font-semibold tracking-[-0.002em]";

/** "Hi Maria," / "Good evening!", the most pressing alert, and "New call". */
function TopBar({ data, hour }: { data: ShellData | null; hour: number | null }) {
  const locale = useLocale();
  const copy = SHELL_COPY[locale];
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-3">
      <div className="flex min-w-0 flex-1 flex-col gap-0.5 font-semibold">
        {data && hour !== null ? (
          <>
            <p className={cn(caption, "truncate text-hg-muted")}>{copy.hi(data.name)}</p>
            <p className="text-[22px] leading-7 tracking-[-0.02em] text-hg-ink sm:text-[24px] sm:leading-[30px]">{greetingFor(hour, locale)}</p>
          </>
        ) : (
          <div aria-hidden className="flex flex-col gap-1.5">
            <span className="hg-shimmer block h-3.5 w-20 rounded-md" />
            <span className="hg-shimmer block h-7 w-44 rounded-lg" />
          </div>
        )}
      </div>

      <AnimatePresence initial={false}>
        {data?.chip && (
          <motion.div
            key={data.chip.id}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
            className="order-last w-full min-w-0 sm:order-none sm:w-auto"
          >
            <Link
              href="/alerts"
              className={cn(
                caption,
                "flex min-w-0 items-center gap-2 rounded-full border border-hg-line bg-white px-3 py-2 text-hg-ink-2 transition-[border-color,box-shadow] duration-200 hover:border-hg-blue-tint hover:shadow-[0_8px_20px_-14px_rgb(47_107_255/0.6)]",
              )}
            >
              <Bell className="size-3.5 shrink-0 text-hg-ink-2" strokeWidth={2.2} aria-hidden />
              <span className="truncate">{data.chip.short}</span>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      <HgButton href={data?.newCallHref ?? "/calls"} size="s" arrow>
        {copy.newCall}
      </HgButton>
    </div>
  );
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** The slide-over menu below 1024px. Escape and the backdrop close it; Tab stays inside while it is open. */
function MobileMenu({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: (closeButton: React.ReactNode) => React.ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const copy = SHELL_COPY[useLocale()];

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    panel?.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !panel) return;
      const items = [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)];
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && (document.activeElement === first || !panel.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !panel.contains(document.activeElement))) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [open, onClose]);

  const closeButton = (
    <button
      type="button"
      data-autofocus
      onClick={onClose}
      aria-label={copy.closeMenu}
      className="flex size-9 cursor-pointer items-center justify-center rounded-full bg-hg-surface text-hg-ink-2 transition-colors hover:bg-hg-blue-soft hover:text-hg-blue"
    >
      <X className="size-4" aria-hidden />
    </button>
  );

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <motion.div
            aria-hidden
            className="absolute inset-0 bg-hg-ink/30 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            onClick={onClose}
          />
          <motion.div
            ref={panelRef}
            id="app-menu"
            role="dialog"
            aria-modal="true"
            aria-label={copy.menu}
            className="absolute inset-y-0 left-0 flex w-[min(288px,86vw)] flex-col overflow-y-auto bg-white px-3.5 py-[18px] shadow-[24px_0_60px_-30px_rgb(11_18_32/0.45)]"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.4, ease: EASE }}
          >
            {children(closeButton)}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/**
 * The app frame for every screen after the landing page, as in the dashboard picture on the landing:
 * a white sidebar (fixed from 1024px, a slide-over menu below), a top bar, and the screen on the soft grey surface.
 */
export function SiteShell({ children, wide = false }: { children: React.ReactNode; wide?: boolean }) {
  const pathname = usePathname();
  const copy = SHELL_COPY[useLocale()];
  const active = activeNav(pathname);
  const onMissed = pathname === "/missed" || pathname.startsWith("/missed/");
  const { caseFile, ready } = useCaseFile();
  const clock = useClock();
  const today = clock?.today ?? null;
  const data = useMemo(() => (ready && today ? shellData(caseFile, today) : null), [ready, caseFile, today]);

  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    menuButton.current?.focus();
  }, []);

  const width = wide ? "max-w-6xl" : "max-w-5xl";
  const alertCount = data?.alertCount ?? 0;

  return (
    <div className="flex flex-1 bg-hg-surface">
      <aside className="sticky top-0 hidden h-dvh w-[240px] shrink-0 self-start overflow-y-auto border-r border-hg-line bg-white px-3.5 py-[22px] lg:block">
        <SidebarContent active={active} onMissed={onMissed} data={data} />
      </aside>

      <MobileMenu open={menuOpen} onClose={closeMenu}>
        {(closeButton) => (
          <SidebarContent
            active={active}
            onMissed={onMissed}
            data={data}
            onNavigate={() => setMenuOpen(false)}
            header={
              <>
                <HgLogo />
                {closeButton}
              </>
            }
          />
        )}
      </MobileMenu>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-hg-line bg-white/85 px-4 backdrop-blur-xl sm:px-6 lg:hidden">
          <HgLogo className="[&>span:last-child]:text-[22px]" />
          <div className="flex items-center gap-1.5">
            <LocaleSwitch className="bg-hg-surface" />
            <Link
              href="/alerts"
              aria-label={copy.alerts(alertCount)}
              className="relative flex size-10 items-center justify-center rounded-full text-hg-ink-2 transition-colors hover:bg-hg-surface"
            >
              <Bell className="size-[18px]" aria-hidden />
              {alertCount > 0 && (
                <span aria-hidden className="absolute top-2 right-2 size-2 rounded-full bg-hg-blue ring-2 ring-white" />
              )}
            </Link>
            <button
              ref={menuButton}
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-expanded={menuOpen}
              aria-controls="app-menu"
              aria-label={copy.openMenu}
              className="flex size-10 cursor-pointer items-center justify-center rounded-full bg-hg-surface text-hg-ink transition-colors hover:bg-hg-blue-soft hover:text-hg-blue"
            >
              <Menu className="size-[18px]" aria-hidden />
            </button>
          </div>
        </header>

        <div className={cn("mx-auto w-full px-4 pt-5 sm:px-6 lg:px-8 lg:pt-7", width)}>
          <TopBar data={data} hour={clock?.hour ?? null} />
        </div>

        <motion.main
          className={cn("mx-auto w-full min-w-0 flex-1 px-4 pt-6 pb-20 sm:px-6 sm:pt-8 lg:px-8", width)}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}
