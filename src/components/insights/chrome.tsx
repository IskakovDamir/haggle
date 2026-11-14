// Header, page intro, calls to action and footer for the insights pages, in the landing's Figma style.
import Image from "next/image";
import Link from "next/link";
import { HgButton, HgLogo, HgSection } from "@/components/landing-v2/ui";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ProductButton } from "./product-button";

export function InsightsHeader() {
  return (
    <header className="mx-auto flex w-full max-w-[1408px] items-center justify-between gap-4 px-4 pt-5 sm:px-8 lg:px-10 xl:px-[104px]">
      <HgLogo />
      <nav aria-label="Insights" className="flex items-center gap-1 sm:gap-2">
        <Link
          href="/insights"
          className="hidden rounded-full px-3.5 py-2 text-[14px] leading-5 font-semibold text-hg-ink-2 transition-colors hover:text-hg-blue sm:inline-flex"
        >
          Insights
        </Link>
        <Link
          href="/phone"
          className="rounded-full px-3.5 py-2 text-[14px] leading-5 font-semibold whitespace-nowrap text-hg-ink-2 transition-colors hover:text-hg-blue"
        >
          Phone numbers
        </Link>
        <HgButton href="/" tone="dark" size="s" className="hidden sm:inline-flex">
          What is Haggle
        </HgButton>
      </nav>
    </header>
  );
}

export function Breadcrumbs({ items }: { items: { href?: string; label: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-[13px] leading-[18px] font-semibold text-hg-muted">
      {items.map((item, i) => (
        <span key={item.label}>
          {i > 0 && <span aria-hidden> / </span>}
          {item.href ? (
            <Link href={item.href} className="transition-colors hover:text-hg-blue">
              {item.label}
            </Link>
          ) : (
            <span aria-current="page" className="text-hg-ink-2">
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}

/** The page's H1, lead and as-of line, with an optional 3D render on the right like the landing hero cards. */
export function PageIntro({
  crumbs,
  title,
  lead,
  asOf,
  art,
}: {
  crumbs: { href?: string; label: string }[];
  title: React.ReactNode;
  lead: React.ReactNode;
  asOf: string;
  art?: { src: string; rotate?: number };
}) {
  return (
    <HgSection className="px-4 pt-10 pb-6 sm:px-8 lg:px-10 lg:pt-14 xl:px-[104px]">
      <div className="relative flex flex-col gap-5 lg:pr-[300px]">
        <Breadcrumbs items={crumbs} />
        <h1 className="max-w-[18ch] text-[clamp(36px,5.5vw,60px)] leading-[1.08] font-semibold tracking-[-0.04em] text-hg-ink">{title}</h1>
        <p className="max-w-[60ch] text-[18px] leading-7 font-medium tracking-[-0.01em] text-hg-muted">{lead}</p>
        <p className="text-[14px] leading-5 font-semibold text-hg-ink-2">
          Data as of {formatDate(asOf)}. Numbers with a source link are quoted from that source. Numbers marked Estimate are Haggle
          estimates until our own calls measure them.
        </p>
        {art && (
          <div aria-hidden className="pointer-events-none absolute top-0 right-0 hidden size-[280px] lg:block">
            <div className="hg-float relative size-full" style={{ rotate: `${art.rotate ?? 0}deg` }}>
              <Image src={art.src} alt="" fill sizes="280px" className="object-contain" priority />
            </div>
          </div>
        )}
      </div>
    </HgSection>
  );
}

/** A section heading inside a page: H2 plus an optional muted lead, left aligned. */
export function SectionTitle({ id, title, lead, className }: { id?: string; title: React.ReactNode; lead?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <h2 id={id} className="text-[clamp(28px,3.6vw,40px)] leading-[1.15] font-semibold tracking-[-0.035em] text-hg-ink">
        {title}
      </h2>
      {lead && <p className="max-w-[64ch] text-[17px] leading-7 font-medium tracking-[-0.01em] text-hg-muted">{lead}</p>}
    </div>
  );
}

/** Padding every insights section shares, so edges line up with the header. */
export const sectionPad = "px-4 sm:px-8 lg:px-10 xl:px-[104px]";

/** The deep blue band with the two calls to action, as in the landing's "Be the bank" block. */
export function CtaBand({
  title,
  lead,
  actions,
}: {
  title: string;
  lead: string;
  actions: { href: string; label: string }[];
}) {
  return (
    <HgSection className={cn("py-10 md:py-14", sectionPad)}>
      <div
        className="relative isolate flex flex-col items-start gap-6 overflow-hidden rounded-[40px] p-6 md:p-12 lg:pr-[340px]"
        style={{ backgroundImage: "linear-gradient(135deg, #2448f0 14.286%, #2f6bff 57.143%, #6f9bff 100%)" }}
      >
        <h2 className="text-[clamp(30px,4vw,44px)] leading-[1.12] font-semibold tracking-[-0.035em] text-white">{title}</h2>
        <p className="max-w-[56ch] text-[18px] leading-7 font-medium tracking-[-0.01em] text-white/80">{lead}</p>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap">
          {actions.map((action, i) => (
            <ProductButton key={action.href} path={action.href} tone={i === 0 ? "white" : "dark"}>
              {action.label}
            </ProductButton>
          ))}
        </div>
        <div aria-hidden className="pointer-events-none absolute right-[-40px] bottom-[-60px] hidden size-[340px] lg:block">
          <div className="hg-float relative size-full -rotate-12">
            <Image src="/landing/demo/3d-phone.png" alt="" fill sizes="340px" className="object-contain" />
          </div>
        </div>
      </div>
    </HgSection>
  );
}

export function InsightsFooter() {
  const caption = "text-[13px] leading-[18px] font-semibold tracking-[-0.002em] text-hg-muted";
  return (
    <footer className={cn("mx-auto flex w-full max-w-[1408px] flex-col items-center gap-4 pt-6 pb-8 text-center lg:flex-row lg:justify-between lg:text-left", sectionPad)}>
      <HgLogo />
      <p className={caption}>Haggle is not a lender or a credit repair organization. These pages are general information, not financial advice.</p>
      <Link href="/insights" className={`${caption} whitespace-nowrap hover:text-hg-blue`}>
        All insights
      </Link>
    </footer>
  );
}
