// "Almost everyone who asks wins": the blue glass bento of survey stats (Figma node 4:18).
import Image from "next/image";
import { cn } from "@/lib/utils";
import { CountText, GrowBar } from "@/components/motion/grow";
import { Stagger, StaggerItem } from "@/components/motion/reveal";
import { HgSection } from "./ui";

const A = "/landing/insight";

/** Blurred glow, placed by its SVG box (the Figma blob frame plus its blur bleed). */
function Glow({ src, width, height, style }: { src: string; width: number; height: number; style: React.CSSProperties }) {
  return <Image src={src} alt="" width={width} height={height} aria-hidden className="pointer-events-none absolute max-w-none" style={style} />;
}

function CardTitle({ title, caption, dark }: { title: string; caption: string; dark?: boolean }) {
  return (
    <div className="flex flex-col gap-px">
      <p className={cn("text-[16px] leading-6 font-medium tracking-[-0.005em]", dark ? "text-white" : "text-hg-ink")}>{title}</p>
      <p className={cn("text-[13px] leading-[18px] font-semibold tracking-[-0.002em]", dark ? "text-white/60" : "text-[#5b6475]")}>{caption}</p>
    </div>
  );
}

function BigNumber({ value, unit, dark }: { value: string; unit: string; dark?: boolean }) {
  return (
    <p className="flex items-baseline gap-2 whitespace-nowrap">
      <span className={cn("text-[64px] leading-[68px] font-normal tracking-[-0.04em] sm:text-[80px] sm:leading-[84px]", dark ? "text-white" : "text-hg-ink")}>
        <CountText value={value} />
      </span>
      <span className={cn("text-[20px] leading-[26px] font-medium", dark ? "text-white/70" : "text-[#5b6475]")}>{unit}</span>
    </p>
  );
}

function Track({ fill, className, fillClassName }: { fill: string; className: string; fillClassName: string }) {
  return (
    <div className={cn("h-4 overflow-hidden rounded-lg", className)}>
      <GrowBar width={fill} className={cn("h-4 rounded-lg", fillClassName)} />
    </div>
  );
}

const card = "relative flex flex-col justify-between rounded-[36px] border p-7 backdrop-blur-[20px]";

export function Insight() {
  return (
    <HgSection className="flex flex-col items-center gap-8 px-4 pt-10 pb-8 font-manrope md:px-10 md:pt-14 md:pb-10">
      <Stagger gap={0.12} amount={0.6} className="flex max-w-[1200px] flex-col items-center gap-4 text-center">
        <StaggerItem as="h2" className="text-[clamp(32px,4.5vw,48px)] leading-[1.125] font-semibold tracking-[-0.035em] text-hg-ink">
          Almost everyone who asks wins, almost nobody asks
        </StaggerItem>
        <StaggerItem as="p" className="max-w-[900px] text-[18px] leading-7 font-medium tracking-[-0.01em] text-hg-muted">
          Banks cut the rate for 84% of people who call, yet fewer than one in four cardholders ever pick up the phone
        </StaggerItem>
      </Stagger>

      <div
        className="relative flex w-full max-w-[1200px] flex-col gap-4 overflow-hidden rounded-[40px] p-4 sm:p-6"
        style={{ backgroundImage: "linear-gradient(155.61deg, #7fb0ff 14.286%, #2f6bff 50%, #1a3fd6 85.714%)" }}
      >
        <Glow src={`${A}/blob-top-left.svg`} width={840} height={580} style={{ left: -230, top: -250 }} />
        <Glow src={`${A}/blob-top-right.svg`} width={780} height={520} style={{ left: "55.833%", top: -230 }} />
        <Glow src={`${A}/blob-center.svg`} width={840} height={520} style={{ left: "18.333%", bottom: -116 }} />
        <Glow src={`${A}/blob-bottom-left.svg`} width={760} height={520} style={{ left: -280, bottom: -228 }} />
        <Glow src={`${A}/blob-bottom-right.svg`} width={780} height={540} style={{ left: "49.167%", bottom: -218 }} />

        {/* Row 1: the cards add up to 1144px inside a 1152px row in Figma, so the row is capped at 1144. */}
        <Stagger gap={0.1} className="relative grid w-full max-w-[1144px] gap-4 lg:grid-cols-[664fr_464fr]">
          <StaggerItem
            className={cn(card, "min-h-[264px] gap-6 border-white/[0.22]")}
            style={{ backgroundImage: "linear-gradient(158.32deg, #2453e6 14.286%, #0f2a9e 85.714%)" }}
          >
            <CardTitle title="Asked their bank" caption="LendingTree, 2026" dark />
            <div className="flex flex-col gap-5">
              <div className="flex flex-wrap items-end gap-x-5 gap-y-2">
                <BigNumber value="84" unit="%" dark />
                <p className="max-w-[260px] pb-3.5 text-[16px] leading-6 font-medium tracking-[-0.005em] text-white/75">
                  got a lower APR, out of every 100 who asked
                </p>
              </div>
              {/* 509 of 608px in Figma */}
              <Track fill="83.7%" className="w-full bg-white/[0.16]" fillClassName="bg-white" />
            </div>
          </StaggerItem>

          <StaggerItem className={cn(card, "min-h-[264px] gap-1 border-white/90 bg-white/[0.94]")}>
            <CardTitle title="Ever asked for a lower rate" caption="Share of cardholders" />
            <div className="flex flex-1 flex-wrap items-end justify-between gap-x-4 gap-y-3">
              <BigNumber value="<1" unit="in 4" />
              <div aria-hidden className="flex w-[232px] max-w-full gap-2 pb-2">
                <Track fill="73%" className="flex-1 bg-hg-blue-tint" fillClassName="bg-hg-blue" />
                <div className="h-4 flex-1 rounded-lg bg-hg-blue-tint" />
                <div className="h-4 flex-1 rounded-lg bg-hg-blue-tint" />
                <div className="h-4 flex-1 rounded-lg bg-hg-blue-tint" />
              </div>
            </div>
          </StaggerItem>
        </Stagger>

        <Stagger gap={0.1} className="relative grid w-full max-w-[1144px] gap-4 md:grid-cols-[1fr_216px] xl:grid-cols-[520fr_376fr_216px]">
          <StaggerItem
            className={cn(card, "min-h-[216px] gap-6 overflow-hidden border-white/[0.16] md:col-span-2 xl:col-span-1")}
            style={{ backgroundImage: "linear-gradient(157.44deg, rgba(11,18,32,0.66) 14.286%, rgba(11,18,32,0.44) 85.714%)" }}
          >
            <Glow src={`${A}/apr-glow.svg`} width={560} height={360} style={{ right: -149, bottom: -223 }} />
            <div className="relative">
              <CardTitle title="APR after one call" caption="Average cut" dark />
            </div>
            <div className="relative flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:justify-between">
              <BigNumber value="−6.3" unit="pts" dark />
              <div className="flex w-full flex-col gap-3 pb-2 text-[13px] leading-[normal] font-semibold sm:w-[240px] sm:min-w-[180px] sm:shrink">
                <div className="flex flex-col gap-2">
                  <p className="flex justify-between text-white/60">
                    <span>Typical</span>
                    <span>22%</span>
                  </p>
                  <Track fill="87.9%" className="w-full bg-white/[0.16]" fillClassName="bg-white/45" />
                </div>
                <div className="flex flex-col gap-2">
                  <p className="flex justify-between">
                    <span className="text-white/60">After one call</span>
                    <span className="text-white">15.7%</span>
                  </p>
                  <Track fill="62.9%" className="w-full bg-white/[0.16]" fillClassName="bg-white" />
                </div>
              </div>
            </div>
          </StaggerItem>

          <StaggerItem className={cn(card, "min-h-[216px] gap-6 border-white/90 bg-gradient-to-b from-[#eaf3fe] to-white")}>
            <CardTitle title="Carry a balance" caption="Month to month" />
            <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
              <BigNumber value="47" unit="%" />
              <div aria-hidden className="pb-2">
                <Track fill="47%" className="w-[168px] bg-hg-blue-tint" fillClassName="bg-hg-blue" />
              </div>
            </div>
          </StaggerItem>

          <StaggerItem
            className={cn(card, "min-h-[216px] gap-6 border-white/50 p-6")}
            style={{ backgroundImage: "linear-gradient(135deg, #3a76ff 14.286%, #1a3fd6 85.714%)" }}
          >
            <div className="flex items-start gap-2.5">
              <p className="flex-1 text-[16px] leading-6 font-medium tracking-[-0.005em] text-white">Retention team</p>
              <Image src={`${A}/toggle.svg`} alt="" width={50} height={30} aria-hidden className="shrink-0" />
            </div>
            <div className="flex flex-col gap-1.5">
              <p className="text-[14px] leading-5 font-medium tracking-[-0.005em] text-white">Every big bank has one, and it can cut your rate</p>
              <p className="text-[13px] leading-[18px] font-semibold tracking-[-0.002em] text-white/65">Haggle asks for it by name</p>
            </div>
          </StaggerItem>
        </Stagger>
      </div>
    </HgSection>
  );
}
