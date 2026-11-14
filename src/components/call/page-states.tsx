// The quiet states every screen needs: loading, nothing here yet, and one calm sentence when something fails.
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

/** Grey blocks shown until the case file has been read from the browser. */
export function PageSkeleton() {
  return (
    <div className="animate-pulse space-y-4" role="status" aria-label="Loading">
      <div className="h-9 w-2/3 rounded-xl bg-ink/10" />
      <div className="h-5 w-1/2 rounded-lg bg-ink/7" />
      <div className="h-64 rounded-2xl bg-ink/7" />
      <div className="h-32 rounded-2xl bg-ink/7" />
    </div>
  );
}

/** A friendly dead end with one way forward. */
export function EmptyState({
  title,
  children,
  href = "/start",
  action = "Add a statement",
}: {
  title: string;
  children: React.ReactNode;
  href?: string;
  action?: string;
}) {
  return (
    <Card className="mx-auto max-w-xl p-6 text-center sm:p-10">
      <h1 className="text-2xl font-extrabold sm:text-3xl">{title}</h1>
      <p className="mt-3 text-muted">{children}</p>
      <Link href={href} className={cn(buttonVariants({ size: "lg" }), "mt-6")}>
        {action}
      </Link>
    </Card>
  );
}

const NOTICE_TONES = {
  info: "border-line bg-card text-ink",
  alarm: "border-alarm/30 bg-alarm-soft text-alarm",
  // For use inside the dark call panel.
  dark: "border-[#4a2a22] bg-[#2a1814] text-[#f3b9a8]",
} as const;

/** One sentence about something that went wrong or needs saying. Announced to screen readers. */
export function Notice({
  tone = "info",
  className,
  children,
}: {
  tone?: keyof typeof NOTICE_TONES;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      role={tone === "info" ? "status" : "alert"}
      className={cn("rounded-xl border px-4 py-3 text-sm", NOTICE_TONES[tone], className)}
    >
      {children}
    </div>
  );
}
