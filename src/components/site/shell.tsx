"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const STEPS = [
  { href: "/start", label: "Statement" },
  { href: "/plan", label: "Plan" },
  { href: "/calls", label: "Calls" },
  { href: "/dashboard", label: "Wins" },
];

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("text-xl font-extrabold tracking-tight text-ink", className)}>
      Hag<span className="ml-0.5 rounded-md bg-lime px-1.5">gle</span>
    </Link>
  );
}

/** Header and page frame for every screen after the landing page. */
export function SiteShell({ children, wide = false }: { children: React.ReactNode; wide?: boolean }) {
  const pathname = usePathname();
  return (
    <>
      <header className="sticky top-0 z-30 border-b border-line bg-paper/90 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center gap-4 px-4 sm:px-6">
          <Logo />
          <nav className="flex items-center gap-1 overflow-x-auto text-sm" aria-label="Steps">
            {STEPS.map((step) => (
              <Link
                key={step.href}
                href={step.href}
                className={cn(
                  "rounded-full px-3 py-1.5 whitespace-nowrap transition-colors",
                  (pathname.startsWith(step.href) || (step.href === "/calls" && pathname === "/call")) ? "bg-ink text-paper" : "text-muted hover:text-ink",
                )}
              >
                {step.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className={cn("mx-auto w-full flex-1 px-4 pt-8 pb-24 sm:px-6", wide ? "max-w-6xl" : "max-w-5xl")}>{children}</main>
    </>
  );
}
