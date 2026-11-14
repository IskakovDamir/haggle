// The tablet + phone picture under the hero copy. Static markup, hidden from assistive tech.
// The pair is laid out at its Figma size (1300 x 700) and scaled down by --s, which the hero sets per breakpoint.
// Phones get the phone alone at full size.
// Only the top 296px shows (the rest is cut off by the hero, as in the design).
import { cn } from "@/lib/utils";
import { HeroTablet } from "./hero-tablet";

const caption = "text-[13px] leading-[18px] font-semibold tracking-[-0.002em]";
const wave = [8, 14, 22, 30, 18, 26, 34, 20, 12, 24, 30, 16, 10, 20, 14, 8];

function HeroPhone({ className }: { className?: string }) {
  return (
    <div className={cn("flex h-[500px] w-[250px] flex-col overflow-hidden rounded-[44px] bg-linear-to-b from-[#2b3446] to-hg-ink p-2.5", className)}>
      <div className="flex min-h-0 w-full flex-1 flex-col items-center gap-3 overflow-hidden rounded-[34px] bg-white px-3.5 pt-3 pb-4">
        <div className="h-[22px] w-[76px] shrink-0 rounded-[11px] bg-hg-ink" />
        <div className="flex w-full items-center gap-2.5">
          <span className={`${caption} flex size-[34px] shrink-0 items-center justify-center rounded-[17px] bg-hg-ink text-white`}>C</span>
          <div className={`${caption} flex min-w-0 flex-1 flex-col whitespace-nowrap`}>
            <span className="text-hg-ink">Chase Card Services</span>
            <span className="text-hg-muted">06:42 · on the call</span>
          </div>
        </div>
        <div className="flex w-full flex-col items-center gap-2 rounded-[18px] bg-hg-blue-soft px-2.5 py-3.5">
          <div className="flex items-center gap-[3px]">
            {wave.map((h, i) => (
              <span key={i} className="hg-wave w-1 rounded-[2px] bg-hg-blue" style={{ height: h, animationDelay: `${(i % 5) * -0.21}s` }} />
            ))}
          </div>
          <span className={`${caption} text-hg-blue`}>Haggle is negotiating</span>
        </div>
        <div className={`${caption} flex w-full flex-col gap-0.5 rounded-[14px] rounded-tr-[4px] bg-hg-blue px-3 py-2.5`}>
          <span className="text-white/72">Haggle AI</span>
          <span className="text-white">Maria wants to stay, can you match 19.99%?</span>
        </div>
        <div className={`${caption} flex w-full flex-col gap-0.5 rounded-[14px] rounded-tl-[4px] bg-hg-surface px-3 py-2.5`}>
          <span className="text-hg-muted">Chase rep</span>
          <span className="text-hg-ink">Done, 19.99% starting today</span>
        </div>
        <div className="flex-1" />
        <div className="flex w-full items-center justify-between rounded-[14px] bg-hg-blue px-3.5 py-3 font-semibold whitespace-nowrap">
          <span className="text-[13px] leading-[18px] tracking-[-0.002em] text-white/75">New APR</span>
          <span className="text-[17px] leading-6 tracking-[-0.01em] text-white">19.99%</span>
        </div>
      </div>
    </div>
  );
}

export function HeroDevices() {
  return (
    <div
      aria-hidden
      inert
      className="relative mx-auto mt-11 h-[296px] w-[250px] shrink-0 overflow-hidden sm:h-[calc(296px*var(--s))] sm:w-[calc(1300px*var(--s))]"
    >
      <div className="absolute top-0 left-0 h-[700px] w-[250px] origin-top-left sm:w-[1300px] sm:scale-(--s)">
        <HeroTablet className="absolute top-0 left-[230px] hidden sm:flex" />
        <HeroPhone className="absolute top-0 left-0 sm:top-[184px]" />
      </div>
    </div>
  );
}
