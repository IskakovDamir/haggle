// A call to action that leads to the Haggle product. While PRODUCT_URL is empty it shows the same pill,
// dimmed, with "Launching soon", and is not a link, so no page sends visitors to a product that is not live.
import { HgButton } from "@/components/landing-v2/ui";
import type { Locale } from "@/lib/i18n/locale";
import { productHref } from "@/lib/product";
import { cn } from "@/lib/utils";

type Tone = "blue" | "dark" | "white";

export function ProductButton({
  path,
  children,
  tone = "blue",
  lang = "en",
  className,
}: {
  path: string;
  children: React.ReactNode;
  tone?: Tone;
  lang?: Locale;
  className?: string;
}) {
  const href = productHref(path);
  if (href) {
    return (
      <HgButton href={href} tone={tone} arrow className={cn("whitespace-normal text-center", className)}>
        {children}
      </HgButton>
    );
  }
  return (
    <span
      aria-disabled="true"
      className={cn(
        "inline-flex shrink-0 cursor-default flex-col items-center justify-center rounded-full px-6 py-3 text-center text-[15px] leading-5 font-semibold tracking-[-0.005em] opacity-70",
        tone === "blue" && "bg-hg-blue text-white",
        tone === "dark" && "bg-hg-ink text-white",
        tone === "white" && "bg-white text-hg-ink",
        className,
      )}
    >
      <span>{children}</span>
      <span className="text-[12px] leading-4 font-medium opacity-80">{lang === "es" ? "Muy pronto" : "Launching soon"}</span>
    </span>
  );
}
