"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { HgLogo } from "@/components/landing-v2/ui";
import { cn } from "@/lib/utils";

const STEPS = [
  { href: "/start", label: "Statement" },
  { href: "/plan", label: "Plan" },
  { href: "/calls", label: "Calls" },
  { href: "/dashboard", label: "Wins" },
];

export function Logo({ className }: { className?: string }) {
  return <HgLogo className={className} />;
}

const isCurrent = (pathname: string, href: string) =>
  pathname.startsWith(href) || (href === "/calls" && pathname === "/call");

/** Header and page frame for every screen after the landing page, in the landing's floating-pill style. */
export function SiteShell({ children, wide = false }: { children: React.ReactNode; wide?: boolean }) {
  const pathname = usePathname();
  return (
    <div className="hg-wash flex flex-1 flex-col">
      <header className="sticky top-0 z-30 px-2 pt-2 sm:px-4 sm:pt-3">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            "mx-auto flex h-14 w-full items-center justify-between gap-3 rounded-full border border-white bg-white/75 py-1.5 pr-1.5 pl-4 shadow-[0_10px_30px_-18px_rgb(11_18_32/0.35)] backdrop-blur-xl",
            wide ? "max-w-6xl" : "max-w-5xl",
          )}
        >
          <HgLogo className="shrink-0 [&>span:last-child]:hidden [&>span:last-child]:sm:inline" />
          <nav aria-label="Steps" className="min-w-0 overflow-x-auto">
            <ul className="flex items-center gap-0.5 rounded-full bg-hg-surface p-1">
              {STEPS.map((step) => {
                const current = isCurrent(pathname, step.href);
                return (
                  <li key={step.href} className="relative">
                    {current && (
                      <motion.span
                        layoutId="shell-step"
                        className="absolute inset-0 rounded-full bg-white shadow-[0_2px_8px_-2px_rgb(11_18_32/0.15)]"
                        transition={{ type: "spring", stiffness: 420, damping: 34 }}
                      />
                    )}
                    <Link
                      href={step.href}
                      aria-current={current ? "page" : undefined}
                      className={cn(
                        "relative block rounded-full px-3 py-1.5 text-[13px] font-semibold whitespace-nowrap transition-colors sm:px-4 sm:text-sm",
                        current ? "text-hg-ink" : "text-hg-muted hover:text-hg-ink",
                      )}
                    >
                      {step.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </motion.div>
      </header>
      <main className={cn("mx-auto w-full flex-1 px-4 pt-8 pb-24 sm:px-6 sm:pt-10", wide ? "max-w-6xl" : "max-w-5xl")}>{children}</main>
    </div>
  );
}
