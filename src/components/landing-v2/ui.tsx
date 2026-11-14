// Shared pieces of the landing page, built from the Figma file "Haggle — Landing".
// Colors and type come from the hg-* tokens in globals.css; images live in public/landing.
import Image from "next/image";
import Link from "next/link";
import { Stagger, StaggerItem } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";

/** The three-ribbon mark on brand blue. Scales with `size`; the blades are positioned as in Figma. */
export function HgMark({ size = 34, className }: { size?: number; className?: string }) {
  const blade = (name: string, inset: string) => (
    <span className="absolute" style={{ inset }}>
      <Image alt="" src={`/landing/shared/mark-${name}.svg`} fill unoptimized className="block max-w-none" />
    </span>
  );
  const fold = (name: string, left: number, top: number, width: number, height: number) => (
    <span className="absolute" style={{ left: `${left}%`, top: `${top}%`, width: `${width}%`, height: `${height}%` }}>
      <Image alt="" src={`/landing/shared/mark-${name}.svg`} fill unoptimized className="block max-w-none" />
    </span>
  );
  return (
    <span
      aria-hidden
      className={cn("relative inline-block shrink-0 overflow-hidden bg-hg-blue", className)}
      style={{ width: size, height: size, borderRadius: size * 0.2695 }}
    >
      {blade("blade1-face", "26.75% 17.33% 54.31% 37.48%")}
      {fold("blade1-fold", 53.523, 26.303, 27.522, 16.581)}
      {blade("blade2-face", "41.72% 33.5% 18.73% 37.87%")}
      {fold("blade2-fold", 38.67, 58.275, 26.427, 21.634)}
      {blade("blade3-face", "24.34% 47.88% 36.29% 24.46%")}
      {fold("blade3-fold", 24.055, 24.697, 13.807, 29.317)}
    </span>
  );
}

/** Mark plus the lowercase wordmark. */
export function HgLogo({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2.5", className)} aria-label="Haggle home">
      <HgMark />
      <span className="text-[24px] leading-none font-bold tracking-[-0.05em] text-hg-ink">haggle</span>
    </Link>
  );
}

type ButtonTone = "blue" | "dark" | "white";

/** The pill button from the Figma components page. Always a link: every landing CTA goes somewhere. */
export function HgButton({
  href,
  children,
  tone = "blue",
  size = "m",
  arrow = false,
  className,
}: {
  href: string;
  children: React.ReactNode;
  tone?: ButtonTone;
  size?: "m" | "s";
  arrow?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex shrink-0 items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap transition-[filter,transform,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0 active:scale-[0.98]",
        tone === "blue" && "hover:shadow-[0_12px_28px_-10px_rgb(47_107_255/0.75)]",
        size === "m" ? "px-6 py-3.5 text-[15px] leading-5 tracking-[-0.005em]" : "px-[18px] py-2.5 text-[14px] leading-5 tracking-[-0.005em]",
        tone === "blue" && "bg-hg-blue text-white",
        tone === "dark" && "bg-hg-ink text-white",
        tone === "white" && "bg-white text-hg-ink",
        className,
      )}
    >
      {children}
      {arrow && (
        <Image
          src={size === "m" ? "/landing/shared/arrow-right.svg" : "/landing/shared/arrow-right-s.svg"}
          alt=""
          width={size === "m" ? 12 : 10.667}
          height={size === "m" ? 12 : 10.667}
          className={cn("transition-transform duration-200 ease-out group-hover:translate-x-0.5", tone === "white" && "invert")}
        />
      )}
    </Link>
  );
}

/** Centered section heading: H2 (48/54) and an optional muted lead line (Body L, 18/28). */
export function HgHeading({ title, lead, className }: { title: React.ReactNode; lead?: React.ReactNode; className?: string }) {
  return (
    <Stagger gap={0.12} amount={0.6} className={cn("flex flex-col items-center gap-4 text-center", className)}>
      <StaggerItem as="h2" className="text-[clamp(32px,4.5vw,48px)] leading-[1.125] font-semibold tracking-[-0.035em] text-hg-ink">
        {title}
      </StaggerItem>
      {lead && (
        <StaggerItem as="p" className="max-w-[64ch] text-[18px] leading-7 font-medium tracking-[-0.01em] text-hg-muted">
          {lead}
        </StaggerItem>
      )}
    </Stagger>
  );
}

/** The 1408px-wide rounded band each section sits in, inset 16px from the page edge as in Figma. */
export function HgSection({
  id,
  children,
  className,
  style,
}: {
  id?: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <section id={id} className={cn("relative mx-auto w-full max-w-[1408px] overflow-hidden", className)} style={style}>
      {children}
    </section>
  );
}
