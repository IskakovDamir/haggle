import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * A Figma icon: a square box with the exported glyph centered at its native size.
 * The SVGs in public/landing/hero keep their own width and height, so we never stretch them.
 */
export function HeroIcon({
  name,
  box,
  width,
  height,
  className,
}: {
  name: string;
  box: number;
  width: number;
  height: number;
  className?: string;
}) {
  return (
    <span className={cn("flex shrink-0 items-center justify-center", className)} style={{ width: box, height: box }}>
      <Image src={`/landing/hero/${name}.svg`} alt="" width={width} height={height} className="block max-w-none" />
    </span>
  );
}
