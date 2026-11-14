// The tablet in the hero: a static picture of Maria's dashboard, built as markup like the Figma frame.
import { cn } from "@/lib/utils";
import { HgButton, HgMark } from "./ui";
import { HeroIcon } from "./hero-icon";

const caption = "text-[13px] leading-[18px] font-semibold tracking-[-0.002em]";
const h4 = "text-[17px] leading-6 font-semibold tracking-[-0.01em]";

const menu = [
  { label: "Overview", icon: "icon-grid", w: 13.3333, h: 13.3333, active: true },
  { label: "My cards", icon: "icon-card", w: 14.6667, h: 10.6667 },
  { label: "Calls", icon: "icon-phone", w: 14.5925, h: 14.6188 },
  { label: "My plan", icon: "icon-layers", w: 14.667, h: 14.6667 },
  { label: "Savings", icon: "icon-chart", w: 13.3333, h: 13.3333 },
  { label: "Alerts", icon: "icon-bell", w: 13.3334, h: 14.6702 },
];

// Left offset, bar height and color for each month, as placed in the 430 x 250 chart frame.
const bars: { m: string; left: number; h: number; tone: "grey" | "blue" | "tint" }[] = [
  { m: "J", left: 0, h: 175, tone: "grey" },
  { m: "F", left: 37, h: 174, tone: "grey" },
  { m: "M", left: 74, h: 174, tone: "grey" },
  { m: "A", left: 110, h: 173, tone: "grey" },
  { m: "M", left: 147, h: 173, tone: "grey" },
  { m: "J", left: 184, h: 127, tone: "blue" },
  { m: "J", left: 221, h: 127, tone: "tint" },
  { m: "A", left: 258, h: 126, tone: "tint" },
  { m: "S", left: 295, h: 126, tone: "tint" },
  { m: "O", left: 331, h: 126, tone: "tint" },
  { m: "N", left: 368, h: 126, tone: "tint" },
  { m: "D", left: 405, h: 125, tone: "tint" },
];
const barTone = { grey: "bg-[#dce2ec]", blue: "bg-hg-blue", tint: "bg-hg-blue-tint" };

function Pill({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return (
    <span className={`${caption} shrink-0 rounded-full px-3 py-1.5 whitespace-nowrap ${light ? "bg-white text-hg-ink" : "bg-hg-blue text-white"}`}>
      {children}
    </span>
  );
}

function Sidebar() {
  return (
    <div className="flex h-full w-[210px] shrink-0 flex-col gap-1 border-r border-hg-line bg-white px-3.5 py-[22px]">
      <div className="flex items-center gap-2.5 px-1.5 pb-[18px]">
        <HgMark />
        <span className="text-[24px] leading-none font-bold tracking-[-0.05em] text-hg-ink">haggle</span>
      </div>
      {menu.map((item) => (
        <div
          key={item.label}
          className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-[14px] leading-5 font-medium tracking-[-0.005em] ${
            item.active ? "bg-hg-blue-soft text-hg-blue" : "text-hg-ink-2"
          }`}
        >
          <HeroIcon name={item.icon} box={16} width={item.w} height={item.h} />
          {item.label}
        </div>
      ))}
      <div className="flex-1" />
      <div className="flex w-full items-center gap-2.5 rounded-[14px] bg-hg-surface p-2.5">
        <span className={`${caption} flex size-8 items-center justify-center rounded-2xl bg-hg-blue text-white`}>M</span>
        <div className={`${caption} flex flex-col whitespace-nowrap`}>
          <span className="text-hg-ink">Maria Lopez</span>
          <span className="text-hg-muted">Pay-per-win plan</span>
        </div>
      </div>
    </div>
  );
}

function InterestChart() {
  return (
    <div className="flex h-full min-w-0 flex-1 flex-col gap-3.5 rounded-[20px] bg-white p-5">
      <div className="flex w-full items-center gap-2.5">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5 whitespace-nowrap">
          <span className={`${h4} text-hg-ink`}>Interest paid per month</span>
          <span className={`${caption} text-hg-muted`}>Chase Freedom · 2026</span>
        </div>
        <Pill>−$51 a month</Pill>
      </div>
      <div className="relative h-[250px] w-[430px] shrink-0">
        {[224, 133, 42].map((top) => (
          <div key={top} className="absolute left-0 h-px w-[430px] bg-[#edf0f5]" style={{ top }} />
        ))}
        {bars.map((bar, i) => (
          <div key={i}>
            <div
              className={`absolute w-[24.833px] rounded-lg ${barTone[bar.tone]}`}
              style={{ left: bar.left, top: 224 - bar.h, height: bar.h }}
            />
            <span
              className={`${caption} absolute top-[232px] w-[24.833px] text-center text-hg-muted`}
              style={{ left: bar.left }}
            >
              {bar.m}
            </span>
          </div>
        ))}
        <span className={`${caption} absolute top-[11px] left-[117px] rounded-[10px] bg-hg-ink px-2.5 py-1.5 whitespace-nowrap text-white`}>
          Call · 27.24% → 19.99%
        </span>
      </div>
    </div>
  );
}

function YourCards() {
  return (
    <div className="flex h-full w-[272px] shrink-0 flex-col gap-3 rounded-[20px] bg-white p-5">
      <span className={`${h4} text-hg-ink`}>Your cards</span>
      <div className="flex w-full flex-col gap-2 rounded-[14px] bg-hg-surface p-3.5">
        <div className="flex items-center justify-between">
          <span className={`${caption} whitespace-nowrap text-hg-ink`}>Chase Freedom · $8,400</span>
          <Pill>Won</Pill>
        </div>
        <div className={`${caption} flex items-center gap-2 whitespace-nowrap text-hg-muted`}>
          <span>APR</span>
          <span className="line-through">27.24%</span>
          <HeroIcon name="icon-arrow-right-xs" box={14} width={9.16667} height={9.16667} />
          <span className={`${h4} text-hg-blue`}>19.99%</span>
        </div>
      </div>
      <div className="flex w-full flex-col gap-2 rounded-[14px] bg-hg-surface p-3.5">
        <div className="flex items-center justify-between">
          <span className={`${caption} whitespace-nowrap text-hg-ink`}>Capital One · $3,100</span>
          <Pill light>Next call</Pill>
        </div>
        <div className={`${caption} flex items-center gap-2 whitespace-nowrap text-hg-muted`}>
          <span>APR</span>
          <span className={`${h4} text-hg-ink`}>29.99%</span>
          <span>· $95 fee</span>
        </div>
      </div>
      <div className="flex-1" />
      <div className="flex w-full flex-col gap-1.5">
        <span className={`${caption} text-hg-muted`}>Saved so far</span>
        <span className="text-[28px] leading-8 font-semibold tracking-[-0.02em] text-hg-blue">$609</span>
        <div className="h-2 w-full overflow-hidden rounded-[4px] bg-hg-surface">
          <div className="h-2 w-[124px] rounded-[4px] bg-hg-blue" />
        </div>
        <span className={`${caption} text-hg-muted`}>Goal $1,135 this year</span>
      </div>
    </div>
  );
}

export function HeroTablet({ className }: { className?: string }) {
  return (
    <div className={cn("flex h-[660px] w-[1040px] overflow-hidden rounded-[44px] bg-linear-to-b from-[#2b3446] to-hg-ink p-3", className)}>
      <div className="flex h-full flex-1 overflow-hidden rounded-[32px] bg-hg-surface">
        <Sidebar />
        <div className="flex h-full min-w-0 flex-1 flex-col gap-[18px] p-6">
          <div className="flex w-full items-center gap-3">
            <div className="flex min-w-0 flex-1 flex-col gap-0.5 font-semibold whitespace-nowrap">
              <span className={`${caption} text-hg-muted`}>Hi Maria,</span>
              <span className="text-[24px] leading-[30px] tracking-[-0.02em] text-hg-ink">Good evening!</span>
            </div>
            <span className={`${caption} flex items-center gap-2 rounded-full border border-hg-line bg-white px-3 py-2 whitespace-nowrap text-hg-ink-2`}>
              <HeroIcon name="icon-bell-s" box={14} width={11.6668} height={12.8364} />
              Capital One promo ends in 41 days
            </span>
            {/* A picture of a button: it lives in an aria-hidden, inert mockup, so it never takes focus. */}
            <HgButton href="/start" size="s" arrow>
              New call
            </HgButton>
          </div>
          <div className="flex min-h-0 w-full flex-1 items-start gap-4">
            <InterestChart />
            <YourCards />
          </div>
        </div>
      </div>
    </div>
  );
}
