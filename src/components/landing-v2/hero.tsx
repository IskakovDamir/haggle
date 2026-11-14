// Hero from the Figma frame "Hero" (12:184): nav, headline with inline pills, CTAs and the device picture.
import Image from "next/image";
import Link from "next/link";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { HgButton, HgLogo, HgMark, HgSection } from "./ui";
import { HeroDevices } from "./hero-devices";
import { HeroIcon } from "./hero-icon";

const heroBg = "linear-gradient(180deg, #b4d6f3 0%, #d9eafa 28%, #f4f8fe 52%, #d4e4ff 100%)";

// Background art. Each image is the blurred export, placed where Figma puts it (blur margin included).
// Right-hand pieces are pinned to the right edge and the low ones to the bottom so they hold up when the hero resizes.
const backdrop: { src: string; w: number; h: number; pos: React.CSSProperties }[] = [
  { src: "glow", w: 1800, h: 1000, pos: { left: "calc(50% - 900px)", bottom: -832 } },
  { src: "cloud-top-left", w: 728, h: 408, pos: { left: -204, top: -144 } },
  { src: "cloud-top-right", w: 728, h: 388, pos: { right: -216, top: -124 } },
  { src: "cloud-mid-left", w: 624, h: 364, pos: { left: -272, top: 348 } },
  { src: "cloud-mid-right", w: 604, h: 384, pos: { right: -244, top: 388 } },
  { src: "cloud-bottom-left", w: 920, h: 480, pos: { left: -300, bottom: -612 } },
  { src: "cloud-bottom-right", w: 960, h: 480, pos: { right: -332, bottom: -632 } },
  { src: "cloud-bottom-center", w: 960, h: 400, pos: { left: "calc(50% - 484px)", bottom: -712 } },
];

const navItems = [
  { label: "Home", href: "/", current: true },
  { label: "How it works", href: "#how" },
  { label: "What we win", href: "#wins", chevron: true },
  { label: "Pricing", href: "#pricing" },
];

const small = "text-[14px] leading-5 font-medium tracking-[-0.005em]";
const lang = "text-[13px] leading-[18px] font-semibold tracking-[-0.002em]";

function Nav() {
  return (
    <nav aria-label="Main" className="relative flex w-full items-center justify-between gap-2 px-2">
      <div className="flex items-center lg:w-[320px]">
        <HgLogo />
      </div>
      <ul className="hidden items-start gap-1 rounded-full border border-white/90 bg-white/55 p-[5px] lg:flex">
        {navItems.map((item) => (
          <li key={item.label}>
            <Link
              href={item.href}
              aria-current={item.current ? "page" : undefined}
              className={`${small} flex items-center gap-1.5 rounded-full px-[18px] py-2.5 whitespace-nowrap transition-colors ${
                item.current ? "bg-white text-hg-ink" : "text-hg-ink-2 hover:bg-white/60"
              }`}
            >
              {item.label}
              {item.chevron && <HeroIcon name="icon-chevron-down" box={14} width={8.16667} height={4.66667} />}
            </Link>
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-end gap-2.5 lg:w-[320px]">
        {/* Language switch is visual for now: only English exists. */}
        <div role="group" aria-label="Language" className="hidden items-center gap-0.5 rounded-full bg-white/60 p-1 sm:flex">
          <span aria-current="true" className={`${lang} flex items-center gap-1.5 rounded-full bg-hg-ink px-2.5 py-1.5 text-white`}>
            <HeroIcon name="icon-globe" box={14} width={12.8333} height={12.8333} />
            EN
          </span>
          <span aria-disabled="true" title="Spanish is coming soon" className={`${lang} cursor-not-allowed px-2.5 py-1.5 text-hg-ink-2`}>
            ES
          </span>
        </div>
        <HgButton href="/dashboard" tone="dark" size="s">
          Log in
        </HgButton>
        <HgButton href="/start" size="s">
          Get started
        </HgButton>
      </div>
    </nav>
  );
}

/** The dark pill with four bars stepping down. Sized in em so it scales with the headline. */
function RateDownPill() {
  const bars = [
    { h: "0.696em", tone: "bg-white/30" },
    { h: "0.543em", tone: "bg-white/50" },
    { h: "0.391em", tone: "bg-white/75" },
    { h: "0.239em", tone: "bg-white" },
  ];
  return (
    <span aria-hidden className="flex h-[1.185em] w-[1.804em] shrink-0 items-center justify-center rounded-[0.587em] bg-hg-ink">
      <span className="flex h-[0.696em] w-[0.957em] items-end gap-[0.087em]">
        {bars.map((bar, i) => (
          <span
            key={bar.h}
            className={`hg-bar w-[0.174em] shrink-0 rounded-[0.087em] ${bar.tone}`}
            style={{ height: bar.h, animationDelay: `${0.7 + i * 0.09}s` }}
          />
        ))}
      </span>
    </span>
  );
}

function Headline() {
  const line = "flex flex-wrap items-center justify-center gap-x-[0.196em] gap-y-[0.065em]";
  return (
    <Stagger
      as="h1"
      onMount
      gap={0.14}
      delay={0.1}
      className="flex flex-col items-center gap-[0.065em] text-center text-[clamp(32px,6.4vw,92px)] leading-[1.0543] font-semibold tracking-[-0.045em] text-hg-ink"
    >
      <StaggerItem as="span" className={line}>
        <span>Let AI</span>
        <span aria-hidden className="hg-pop block size-[1.185em] shrink-0 overflow-hidden rounded-full bg-hg-blue" style={{ animationDelay: "0.35s" }}>
          <HgMark size={109} className="size-full!" />
        </span>
        <span>call your bank</span>
      </StaggerItem>
      <StaggerItem as="span" className={line}>
        <span>and lower your</span>
        <RateDownPill />
        <span>card rate</span>
      </StaggerItem>
    </Stagger>
  );
}

export function Hero() {
  return (
    <HgSection
      className="mt-2 flex w-[calc(100%-16px)] flex-col items-center rounded-[32px] px-4 pt-5 font-manrope [--s:0.44] sm:mt-4 sm:w-[calc(100%-32px)] sm:px-6 md:[--s:0.52] lg:[--s:0.72] xl:[--s:0.9] min-[1380px]:[--s:1]"
      style={{ backgroundImage: heroBg }}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {backdrop.map((item, i) => (
          <Image
            key={item.src}
            src={`/landing/hero/${item.src}.svg`}
            alt=""
            width={item.w}
            height={item.h}
            className={`absolute block max-w-none ${item.src === "glow" ? "" : "hg-drift"}`}
            style={{ ...item.pos, animationDelay: `${-i * 2.3}s`, animationDirection: i % 2 ? "reverse" : "normal" }}
          />
        ))}
      </div>

      <Reveal className="relative w-full" y={-12} delay={0}>
        <Nav />
      </Reveal>

      <div className="relative flex flex-col items-center gap-[26px] pt-12">
        <Reveal delay={0} y={10}>
          <Link
            href="/missed"
            className="group inline-flex items-center gap-2 rounded-full border border-white bg-white/70 py-1.5 pr-3 pl-1.5 text-[14px] font-semibold text-hg-ink-2 backdrop-blur transition-colors hover:bg-white"
          >
            <span className="rounded-full bg-hg-blue px-2.5 py-1 text-[12px] text-white">New</span>
            Missed a payment? Get the late fee back
            <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span>
          </Link>
        </Reveal>
        <Headline />
        <Reveal as="p" delay={0.45} y={16} className="max-w-[960px] text-center text-[16px] leading-6 font-medium tracking-[-0.01em] text-hg-ink-2 sm:text-[18px] sm:leading-7">
          Haggle calls your card issuer, waits on hold and negotiates a lower APR, and you pay only after you save
        </Reveal>
        <Reveal delay={0.6} y={16} className="flex flex-wrap items-center justify-center gap-3">
          <HgButton href="/missed" arrow>
            I missed a payment
          </HgButton>
          <HgButton href="/start" tone="dark">
            Lower my rate
          </HgButton>
        </Reveal>
      </div>

      <Reveal delay={0.75} y={80} amount={0} className="relative w-full">
        <HeroDevices />
      </Reveal>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[120px] bg-linear-to-b from-white/0 to-white sm:h-[calc(180px*var(--s))]"
      />
    </HgSection>
  );
}
