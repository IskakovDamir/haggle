// The pale blue rounded panel with four soft white blobs, shared by Pricing, Versus and FAQ.
// Each section keeps its own copy of the blob SVGs in public/landing/<section>/.
import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Blob SVGs are drawn at their natural size (they include the blur margin).
 * The two top blobs hang off the top corners; the two bottom ones are anchored to the
 * panel's bottom edge, and `bottoms` gives their offsets for that section's panel height.
 */
export function BlobPanel({
  dir,
  angle,
  bottoms,
  className,
  children,
}: {
  dir: "pricing" | "versus" | "faq";
  angle: number;
  bottoms: { center: number; left: number };
  className?: string;
  children: React.ReactNode;
}) {
  const blob = (name: string, width: number, height: number, style: React.CSSProperties) => (
    <Image
      src={`/landing/${dir}/blob-${name}.svg`}
      alt=""
      width={width}
      height={height}
      className="pointer-events-none absolute block max-w-none"
      style={style}
    />
  );
  return (
    <div
      className={cn("relative isolate w-full overflow-hidden rounded-[40px]", className)}
      style={{ backgroundImage: `linear-gradient(${angle}deg, #c4ddf6 14.286%, #e4effb 50%, #cfe0ff 85.714%)` }}
    >
      <div aria-hidden className="absolute inset-0 -z-10">
        {blob("top-left", 800, 520, { left: -250, top: -230 })}
        {blob("top-right", 800, 500, { right: -190, top: -210 })}
        {blob("bottom-center", 840, 500, { left: "calc(50% - 400px)", bottom: bottoms.center })}
        {blob("bottom-left", 700, 480, { left: -290, bottom: bottoms.left })}
      </div>
      {children}
    </div>
  );
}
