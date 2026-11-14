// Hero from the Figma frame "Hero" (12:184): nav, headline with inline pills, CTAs and the device picture.
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { LocaleSwitch } from "@/components/i18n/locale-switch";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { landingPath, type Copy, type Locale } from "@/lib/i18n/locale";
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

type HeroCopy = {
  navLabel: string;
  nav: { home: string; how: string; wins: string; pricing: string };
  logIn: string;
  getStarted: string;
  badge: string;
  badgeText: string;
  /** The headline's two lines, split around the inline pills: [before mark, after mark] and [before bars, after bars]. */
  headline: [[string, string], [string, string]];
  lead: string;
  missed: string;
  lower: string;
};

const COPY: Copy<HeroCopy> = {
  en: {
    navLabel: "Main",
    nav: { home: "Home", how: "How it works", wins: "What we win", pricing: "Pricing" },
    logIn: "Log in",
    getStarted: "Get started",
    badge: "New",
    badgeText: "Missed a payment? Get the late fee back",
    headline: [
      ["Let AI", "call your bank"],
      ["and lower your", "card rate"],
    ],
    lead: "Haggle calls your card issuer, waits on hold and negotiates a lower APR, and you pay only after you save",
    missed: "I missed a payment",
    lower: "Lower my rate",
  },
  es: {
    navLabel: "Principal",
    nav: { home: "Inicio", how: "Cómo funciona", wins: "Qué ganas", pricing: "Precios" },
    logIn: "Entrar",
    getStarted: "Empezar",
    badge: "Nuevo",
    badgeText: "¿Se te pasó un pago? Recupera el cargo por atraso",
    headline: [
      ["Que la IA", "llame a tu banco"],
      ["y baje tu", "tasa de interés"],
    ],
    lead: "Haggle llama a tu banco, espera en línea por ti y negocia una APR más baja. Y solo pagas si ahorras",
    missed: "Se me pasó un pago",
    lower: "Bajar mi tasa",
  },
};

const small = "text-[14px] leading-5 font-medium tracking-[-0.005em]";

function Nav({ locale }: { locale: Locale }) {
  const t = COPY[locale];
  const navItems = [
    { label: t.nav.home, href: landingPath(locale), current: true },
    { label: t.nav.how, href: "#how" },
    { label: t.nav.wins, href: "#wins", chevron: true },
    { label: t.nav.pricing, href: "#pricing" },
  ];
  return (
    <nav aria-label={t.navLabel} className="relative flex w-full items-center justify-between gap-2 px-2">
      <div className="flex items-center lg:w-[320px]">
        <HgLogo locale={locale} />
      </div>
      <ul className="hidden items-start gap-1 rounded-full border border-white/90 bg-white/55 p-[5px] lg:flex">
        {navItems.map((item) => (
          <li key={item.href}>
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
        <LocaleSwitch landing={locale} className="hidden sm:flex" />
        <HgButton href="/dashboard" tone="dark" size="s">
          {t.logIn}
        </HgButton>
        <HgButton href="/start" size="s">
          {t.getStarted}
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

function Headline({ locale }: { locale: Locale }) {
  const [[a, b], [c, d]] = COPY[locale].headline;
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
        <span>{a}</span>
        <span aria-hidden className="hg-pop block size-[1.185em] shrink-0 overflow-hidden rounded-full bg-hg-blue" style={{ animationDelay: "0.35s" }}>
          <HgMark size={109} className="size-full!" />
        </span>
        <span>{b}</span>
      </StaggerItem>
      <StaggerItem as="span" className={line}>
        <span>{c}</span>
        <RateDownPill />
        <span>{d}</span>
      </StaggerItem>
    </Stagger>
  );
}

export function Hero({ locale = "en" }: { locale?: Locale }) {
  const t = COPY[locale];
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
        <Nav locale={locale} />
      </Reveal>

      <div className="relative flex flex-col items-center gap-[26px] pt-12">
        <Reveal delay={0} y={10}>
          <Link
            href="/missed"
            className="group inline-flex items-center gap-2 rounded-full border border-white bg-white/70 py-1.5 pr-3 pl-1.5 text-[14px] font-semibold text-hg-ink-2 backdrop-blur transition-colors hover:bg-white"
          >
            <span className="rounded-full bg-hg-blue px-2.5 py-1 text-[12px] text-white">{t.badge}</span>
            {t.badgeText}
            <ArrowRight aria-hidden className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" strokeWidth={2.25} />
          </Link>
        </Reveal>
        <Headline locale={locale} />
        <Reveal as="p" delay={0.45} y={16} className="max-w-[960px] text-center text-[16px] leading-6 font-medium tracking-[-0.01em] text-hg-ink-2 sm:text-[18px] sm:leading-7">
          {t.lead}
        </Reveal>
        <Reveal delay={0.6} y={16} className="flex flex-wrap items-center justify-center gap-3">
          <HgButton href="/missed" arrow>
            {t.missed}
          </HgButton>
          <HgButton href="/start" tone="dark">
            {t.lower}
          </HgButton>
        </Reveal>
      </div>

      <Reveal delay={0.75} y={80} amount={0} className="relative w-full">
        <HeroDevices locale={locale} />
      </Reveal>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[120px] bg-linear-to-b from-white/0 to-white sm:h-[calc(180px*var(--s))]"
      />
    </HgSection>
  );
}
