// The card fills from the Figma file "Haggle — App": flat white, brand blue, ink and the pale blue wash.
// /start and /missed share them, so a card on one screen looks like the same card on the other.
import { cn } from "@/lib/utils";

export type Surface = "white" | "blue" | "ink" | "wash";

export const SURFACE: Record<Surface, string> = {
  white: "border border-hg-line bg-white",
  blue: "bg-[linear-gradient(120deg,#2448f0_0%,#2f6bff_44%,#8db6ff_100%)] text-white",
  ink: "bg-[linear-gradient(120deg,#2a3346_0%,#151c2b_45%,#0b1220_100%)] text-white",
  wash: "bg-[linear-gradient(135deg,#c6def6_0%,#e2eefb_50%,#cfdfff_100%)]",
};

/** Blue and ink cards carry white text and the inputs that sit on color. */
export const onColor = (surface: Surface) => surface === "blue" || surface === "ink";

/** The numbered dot before a section title. White on a colored card, blue everywhere else. */
export function StepDot({ n, surface = "white", size = "m" }: { n: number; surface?: Surface; size?: "s" | "m" }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-bold tabular",
        size === "m" ? "size-7 text-sm" : "size-6 text-[11px]",
        onColor(surface) ? "bg-white text-hg-blue" : "bg-hg-blue text-white",
      )}
    >
      {n}
    </span>
  );
}

/**
 * The "Sample data" tag as the redesign draws it: blue words on the soft blue, with the warm outline that
 * marks sample data everywhere. Every screen that shows sample data carries it.
 */
export function SampleTag({ children = "Sample data", className }: { children?: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-leak/30 bg-hg-blue-soft px-2.5 py-0.5 text-xs font-medium text-hg-blue",
        className,
      )}
    >
      <span aria-hidden className="size-1.5 rounded-full bg-hg-blue" />
      {children}
    </span>
  );
}
