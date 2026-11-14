// The quiet states every screen needs: loading, nothing here yet, and one calm sentence when something fails.
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

/** Soft shimmering blocks shown until the case file has been read from the browser. */
export function PageSkeleton() {
  return (
    <div className="space-y-4" role="status" aria-label="Loading">
      <div className="hg-shimmer h-6 w-28 rounded-full" />
      <div className="hg-shimmer h-12 w-2/3 rounded-2xl" />
      <div className="hg-shimmer h-5 w-1/2 rounded-xl" />
      <div className="hg-shimmer mt-2 h-64 rounded-[32px]" />
      <div className="hg-shimmer h-32 rounded-[28px]" />
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
    <Card className="mx-auto max-w-xl rounded-[32px] p-8 text-center sm:p-12">
      <span aria-hidden className="mx-auto mb-5 flex size-12 items-center justify-center rounded-full bg-hg-blue-soft">
        <span className="size-3 rounded-full bg-hg-blue shadow-[0_0_0_6px_rgb(47_107_255/0.15)]" />
      </span>
      <h1 className="text-[clamp(26px,4vw,34px)] leading-[1.15] font-semibold tracking-[-0.035em] text-hg-ink">{title}</h1>
      <p className="mx-auto mt-3 max-w-[44ch] text-muted">{children}</p>
      <Link href={href} className={cn(buttonVariants({ size: "lg" }), "mt-7")}>
        {action}
      </Link>
    </Card>
  );
}

const NOTICE_TONES = {
  info: "border-line bg-card text-ink",
  alarm: "border-alarm/20 bg-alarm-soft text-alarm",
  // For use inside the call panel: a softer orange, so a hiccup on the call reads calm, not alarming.
  dark: "border-leak/20 bg-leak-soft text-[#a83a12]",
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
      className={cn("rounded-2xl border px-4 py-3 text-sm leading-snug", NOTICE_TONES[tone], className)}
    >
      {children}
    </div>
  );
}
