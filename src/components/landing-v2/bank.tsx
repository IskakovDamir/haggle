// "Your bank would rather say yes": the blue band with the bank's earnings and the 3D bank (Figma node 4:129).
import Image from "next/image";
import { HgSection } from "./ui";

const A = "/landing/bank";

/** Blurred glow, placed by its SVG box (the Figma blob frame plus its blur bleed). */
function Glow({ src, width, height, style }: { src: string; width: number; height: number; style: React.CSSProperties }) {
  return <Image src={src} alt="" width={width} height={height} aria-hidden className="pointer-events-none absolute max-w-none" style={style} />;
}

const bars = [
  { label: "Nothing changes", value: "$1,600", fill: "100%", tone: "bg-white/50", win: false },
  { label: "You leave for a 0% card", value: "$0", fill: "0%", tone: "", win: false },
  { label: "Rate cut to 15%", value: "$1,200", fill: "75%", tone: "bg-white", win: true },
];

const strong = "text-[17px] leading-6 font-semibold tracking-[-0.01em] text-white";

export function Bank() {
  return (
    <HgSection className="px-4 py-10 font-manrope md:px-10 md:py-14">
      <div
        className="relative mx-auto flex w-full max-w-[1200px] flex-col items-start gap-10 overflow-hidden rounded-[40px] p-6 md:p-12 xl:flex-row xl:items-center xl:gap-12 xl:pr-[380px]"
        style={{ backgroundImage: "linear-gradient(161.82deg, #2453e6 14.286%, #0f2a9e 85.714%)" }}
      >
        <Glow src={`${A}/blob-top-left.svg`} width={840} height={560} style={{ left: -300, top: -280 }} />
        <Glow src={`${A}/blob-bottom-right.svg`} width={760} height={520} style={{ left: "56.667%", bottom: -288 }} />

        <div className="relative flex w-full max-w-[400px] flex-col items-start gap-5 xl:shrink-0">
          <h2 className="text-[clamp(32px,4.5vw,48px)] leading-[1.125] font-semibold tracking-[-0.035em] text-white">Your bank would rather say yes</h2>
          <p className="text-[18px] leading-7 font-medium tracking-[-0.01em] text-white/70">
            A customer carrying a balance is the most profitable one, so every big bank keeps a retention team that is allowed to cut your rate
            before you leave
          </p>
          <div className="flex flex-wrap gap-2.5">
            {["84% get a rate cut", "94% get the fee waived"].map((chip) => (
              <span
                key={chip}
                className="rounded-full border border-white/35 bg-white/[0.14] px-3.5 py-2 text-[14px] leading-5 font-medium tracking-[-0.005em] whitespace-nowrap text-white"
              >
                {chip}
              </span>
            ))}
          </div>
        </div>

        <div className="relative flex w-full max-w-[400px] min-w-0 flex-col gap-6 xl:max-w-none xl:flex-1">
          <p className="text-[14px] leading-5 font-medium tracking-[-0.005em] text-white/70">What the bank earns in a year on $8,000 at 20%</p>
          {bars.map((bar) => (
            <div key={bar.label} className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <p className={strong}>{bar.label}</p>
                  {bar.win && (
                    <span className="rounded-full bg-white px-3 py-1.5 text-[13px] leading-[18px] font-semibold tracking-[-0.002em] whitespace-nowrap text-[#1a3fd6]">
                      Your win
                    </span>
                  )}
                </div>
                <p className={`${strong} whitespace-nowrap`}>{bar.value}</p>
              </div>
              <div className="h-4 overflow-hidden rounded-lg bg-white/[0.16]">
                {bar.tone && <div className={`h-4 rounded-lg ${bar.tone}`} style={{ width: bar.fill }} />}
              </div>
            </div>
          ))}
        </div>

        {/* 3D bank: a 412px image turned 6deg inside a 452.9px box that bleeds off the card's right edge. */}
        <div className="pointer-events-none relative -mt-4 -mr-10 -mb-20 flex size-[300px] shrink-0 items-center justify-center self-end md:absolute md:right-[-70px] md:bottom-[-60px] md:m-0 md:size-[320px] lg:right-[-60px] lg:bottom-[-80px] lg:size-[400px] xl:top-[5px] xl:right-[-100.9px] xl:bottom-auto xl:size-[452.9px]">
          <div className="relative size-[90.99%] rotate-6">
            <Image src={`${A}/bank-3d.png`} alt="" fill sizes="(min-width: 1280px) 412px, 364px" className="object-contain" />
          </div>
        </div>
      </div>
    </HgSection>
  );
}
