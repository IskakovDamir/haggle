// The dashboard's building blocks, in the visual language of the dashboard picture on the landing:
// white rounded-[20px] panels on the grey surface, 17px titles, 13px captions, blue and white pills.
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export const caption = "text-[13px] leading-[18px] font-semibold tracking-[-0.002em]";
export const h4 = "text-[17px] leading-6 font-semibold tracking-[-0.01em]";

/** A white panel on the grey surface. */
export function Panel({
  children,
  className,
  as: Tag = "section",
  ...rest
}: {
  children: React.ReactNode;
  className?: string;
  as?: "section" | "div" | "article" | "li";
} & Omit<React.HTMLAttributes<HTMLElement>, "className" | "children">) {
  return (
    <Tag
      className={cn("rounded-[20px] bg-white p-5 shadow-[0_1px_2px_rgb(11_18_32/0.03)] sm:p-6", className)}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/** A panel's title row: the title, an optional caption under it, and something on the right. */
export function PanelHeader({
  title,
  sub,
  id,
  right,
  className,
}: {
  title: React.ReactNode;
  sub?: React.ReactNode;
  id?: string;
  right?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-start justify-between gap-x-3 gap-y-2", className)}>
      <div className="flex min-w-0 flex-col gap-0.5">
        <h2 id={id} className={cn(h4, "text-hg-ink")}>
          {title}
        </h2>
        {sub && <p className={cn(caption, "text-hg-muted")}>{sub}</p>}
      </div>
      {right}
    </div>
  );
}

/** A small rounded label: solid blue, or white on a grey row. */
export function Pill({ children, tone = "blue", className }: { children: React.ReactNode; tone?: "blue" | "white" | "soft"; className?: string }) {
  return (
    <span
      className={cn(
        caption,
        "inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1 whitespace-nowrap",
        tone === "blue" && "bg-hg-blue text-white",
        tone === "white" && "bg-white text-hg-ink",
        tone === "soft" && "bg-hg-blue-soft text-hg-blue",
        className,
      )}
    >
      {children}
    </span>
  );
}

/** "See all →": a quiet link in a panel's corner. */
export function PanelLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={cn(caption, "group inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-hg-blue transition-colors hover:bg-hg-blue-soft")}
    >
      {children}
      <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
    </Link>
  );
}

/** A page's title block inside the app frame. */
export function PageTitle({ title, lead, eyebrow }: { title: React.ReactNode; lead?: React.ReactNode; eyebrow?: React.ReactNode }) {
  return (
    <header className="mb-6 sm:mb-8">
      {eyebrow}
      <h1 className="text-[clamp(28px,4vw,40px)] leading-[1.1] font-semibold tracking-[-0.035em] text-hg-ink">{title}</h1>
      {lead && <p className="mt-2 max-w-[62ch] text-[16px] leading-7 font-medium tracking-[-0.01em] text-hg-muted">{lead}</p>}
    </header>
  );
}
