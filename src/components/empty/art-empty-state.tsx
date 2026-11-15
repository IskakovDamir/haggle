// A dead end with a 3D picture on top and one way forward: the empty Savings and Alerts screens.
import Image from "next/image";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ArtEmptyState({
  title,
  children,
  art,
  tone = "white",
  href = "/start",
  action = "Add a statement",
}: {
  title: string;
  children: React.ReactNode;
  /** A picture from public/app/3d, drawn at the top of the card. */
  art: { src: string; width: number; height: number };
  /** "blue" is the deep brand gradient with white type; "white" is a plain card. */
  tone?: "blue" | "white";
  href?: string;
  action?: string;
}) {
  const blue = tone === "blue";
  return (
    <section
      className={cn(
        "mx-auto max-w-[640px] rounded-[32px] px-6 pt-5 pb-10 text-center sm:rounded-[40px] sm:px-12 sm:pt-6 sm:pb-12",
        blue ? "bg-linear-135 from-[#2453e6] to-[#0f2a9e] text-white" : "border border-[#e8ecf3] bg-white",
      )}
    >
      <div aria-hidden className="mx-auto flex h-[210px] items-start justify-center sm:h-[290px]">
        <Image
          src={art.src}
          alt=""
          width={art.width}
          height={art.height}
          priority
          className="h-auto max-h-full w-[150px] object-contain object-top sm:w-[210px]"
        />
      </div>
      <h1
        className={cn(
          "mt-1.5 text-[clamp(26px,4vw,34px)] leading-[1.15] font-semibold tracking-[-0.035em]",
          blue ? "text-white" : "text-hg-ink",
        )}
      >
        {title}
      </h1>
      <p className={cn("mx-auto mt-3 max-w-[420px] text-base leading-6", blue ? "text-white/68" : "text-muted")}>{children}</p>
      <Link
        href={href}
        className={cn(
          buttonVariants({ size: "lg", variant: blue ? "outline" : "default" }),
          "mt-7",
          blue && "border-transparent bg-white text-hg-ink shadow-[0_12px_28px_-14px_rgb(5_16_60/0.7)] hover:border-transparent hover:bg-white",
        )}
      >
        {action}
      </Link>
    </section>
  );
}
