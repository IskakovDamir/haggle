// "What Haggle wins for you": four outcome cards with 3D illustrations, from Figma node 5:18.
import Image from "next/image";
import { cn } from "@/lib/utils";
import { HgHeading, HgSection } from "./ui";

type Tone = "blue" | "white" | "dark";

type Win = {
  title: string;
  titleSoft: string;
  body: string;
  tone: Tone;
  /** 3D illustration: 290px square, top-left offset inside the 572x250 card, rotation in degrees. */
  art: { src: string; x: number; y: number; rotate: number };
};

const WINS: Win[] = [
  {
    title: "Lower card",
    titleSoft: "interest",
    body: "Rate cuts, 0% transfers and hardship programs, about 6.3 points off on average",
    tone: "blue",
    art: { src: "/landing/wins/3d-arrow-down.png", x: 267.2, y: 17.42, rotate: 5.58 },
  },
  {
    title: "Higher credit",
    titleSoft: "score",
    body: "Lower utilization, limit increases and goodwill removals",
    tone: "white",
    art: { src: "/landing/wins/3d-gauge.png", x: 268.41, y: 22.77, rotate: 8 },
  },
  {
    title: "Fees back",
    titleSoft: "and bonuses",
    body: "Annual fees waived in 94% of asks, late fees refunded, retention offers",
    tone: "white",
    art: { src: "/landing/wins/3d-gift.png", x: 300.77, y: -17.59, rotate: -8 },
  },
  {
    title: "Price hikes",
    titleSoft: "blocked",
    body: "When a promo ends or a rate goes up, Haggle calls again",
    tone: "dark",
    art: { src: "/landing/wins/3d-bell.png", x: 184.65, y: 60.19, rotate: 33.85 },
  },
];

const TONES: Record<Tone, { card: string; title: string; soft: string; body: string; button: string; link: string; arrow: string }> = {
  blue: {
    card: "bg-[linear-gradient(156.39deg,#2448f0_14.286%,#2f6bff_57.143%,#8db6ff_85.714%)]",
    title: "text-white",
    soft: "text-white/58",
    body: "text-white/80",
    button: "bg-white",
    link: "text-white",
    arrow: "/landing/wins/arrow-up-right-blue.svg",
  },
  white: {
    card: "bg-white",
    title: "text-hg-ink",
    soft: "text-[#9aa3b2]",
    body: "text-[#5b6475]",
    button: "bg-hg-ink",
    link: "text-hg-ink",
    arrow: "/landing/wins/arrow-up-right-white.svg",
  },
  dark: {
    card: "bg-[linear-gradient(156.39deg,#1e2740_14.286%,#0b1220_85.714%)]",
    title: "text-white",
    soft: "text-white/45",
    body: "text-white/70",
    button: "bg-white",
    link: "text-white",
    arrow: "/landing/wins/arrow-up-right-ink.svg",
  },
};

/** Soft white blobs behind the cards. Left is a share of the 1200px panel, the rest is px from Figma. */
const BLOBS = [
  { src: "/landing/wins/blob-top-left.svg", left: -250, top: -230, w: 800, h: 520 },
  { src: "/landing/wins/blob-top-right.svg", left: 590, top: -210, w: 800, h: 500 },
  { src: "/landing/wins/blob-bottom-center.svg", left: 200, top: 256, w: 840, h: 500 },
  { src: "/landing/wins/blob-bottom-left.svg", left: -290, top: 206, w: 700, h: 480 },
];

function WinCard({ win }: { win: Win }) {
  const t = TONES[win.tone];
  return (
    <article
      className={cn(
        "relative flex min-h-[340px] flex-col justify-between overflow-hidden rounded-[32px] p-8 sm:h-[250px] sm:min-h-0",
        t.card,
      )}
    >
      <div className="relative z-10 flex w-[236px] max-w-full flex-col gap-3.5">
        <h3 className="text-[38px] leading-[44px] font-semibold tracking-[-0.03em] whitespace-nowrap">
          <span className={cn("block", t.title)}>{win.title}</span>
          <span className={cn("block", t.soft)}>{win.titleSoft}</span>
        </h3>
        <p className={cn("text-[14px] leading-5 font-medium tracking-[-0.005em]", t.body)}>{win.body}</p>
      </div>
      <a href="#how" className="group relative z-10 flex w-fit items-center gap-3.5">
        <span className={cn("flex size-10 items-center justify-center rounded-[20px] transition-transform group-hover:scale-105", t.button)}>
          <Image src={t.arrow} alt="" width={8.13333} height={8.13333} unoptimized />
        </span>
        <span className={cn("text-[15px] leading-5 font-medium", t.link)}>LEARN MORE</span>
      </a>
      <div
        aria-hidden
        className="pointer-events-none absolute -right-5 -bottom-8 size-[150px] sm:right-auto sm:bottom-auto sm:left-(--x) sm:top-(--y) sm:size-[290px]"
        style={{ "--x": `${win.art.x}px`, "--y": `${win.art.y}px`, rotate: `${win.art.rotate}deg` } as React.CSSProperties}
      >
        <Image src={win.art.src} alt="" width={290} height={290} className="size-full object-contain" />
      </div>
    </article>
  );
}

export function Wins() {
  return (
    <HgSection id="wins" className="flex flex-col items-center gap-8 px-4 pt-14 pb-10 font-manrope sm:px-8 lg:px-12 xl:px-[104px]">
      <HgHeading
        title="What Haggle wins for you"
        lead="Haggle doesn’t hand you advice, it picks up the phone, waits on hold, negotiates and keeps watching"
        className="[&_h2]:max-w-[720px] [&_p]:max-w-[900px] [&_p]:text-[18px] [&_p]:leading-7 [&_p]:tracking-[-0.01em] [&_p]:text-hg-muted"
      />
      <div className="relative w-full max-w-[1200px] overflow-hidden rounded-[40px] bg-[linear-gradient(155.14deg,#c4ddf6_14.286%,#e4effb_50%,#cfe0ff_85.714%)] p-3 sm:p-5">
        {BLOBS.map((b) => (
          <Image
            key={b.src}
            src={b.src}
            alt=""
            aria-hidden
            unoptimized
            width={b.w}
            height={b.h}
            className="pointer-events-none absolute block max-w-none"
            style={{ left: `${(b.left / 1200) * 100}%`, top: b.top, width: b.w, height: b.h }}
          />
        ))}
        <div className="relative grid grid-cols-1 gap-4 lg:grid-cols-2">
          {WINS.map((win) => (
            <WinCard key={win.title} win={win} />
          ))}
        </div>
      </div>
    </HgSection>
  );
}
