// The tablet in the hero: a static picture of Maria's dashboard, built as markup like the Figma frame.
import type { Copy, Locale } from "@/lib/i18n/locale";
import { cn } from "@/lib/utils";
import { HgButton, HgMark } from "./ui";
import { HeroIcon } from "./hero-icon";
import { ArrowText } from "@/components/ui/arrow-text";

const caption = "text-[13px] leading-[18px] font-semibold tracking-[-0.002em]";
const h4 = "text-[17px] leading-6 font-semibold tracking-[-0.01em]";

type TabletCopy = {
  menu: [string, string, string, string, string, string];
  plan: string;
  chartTitle: string;
  chartCut: string;
  /** One letter per month, January first. */
  months: string[];
  callTag: string;
  cards: string;
  won: string;
  next: string;
  fee: string;
  savedSoFar: string;
  goal: string;
  hi: string;
  greeting: string;
  promo: string;
  newCall: string;
};

const COPY: Copy<TabletCopy> = {
  en: {
    menu: ["Overview", "My cards", "Calls", "My plan", "Savings", "Alerts"],
    plan: "Pay-per-win plan",
    chartTitle: "Interest paid per month",
    chartCut: "−$51 a month",
    months: ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"],
    callTag: "Call · 27.24% → 19.99%",
    cards: "Your cards",
    won: "Won",
    next: "Next call",
    fee: "· $95 fee",
    savedSoFar: "Saved so far",
    goal: "Goal $1,135 this year",
    hi: "Hi Maria,",
    greeting: "Good evening!",
    promo: "Capital One promo ends in 41 days",
    newCall: "New call",
  },
  es: {
    menu: ["Resumen", "Mis tarjetas", "Llamadas", "Mi plan", "Ahorros", "Alertas"],
    plan: "Plan pago por resultado",
    chartTitle: "Intereses pagados por mes",
    chartCut: "−$51 al mes",
    months: ["E", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"],
    callTag: "Llamada · 27.24% → 19.99%",
    cards: "Tus tarjetas",
    won: "Logrado",
    next: "Próxima",
    fee: "· cuota de $95",
    savedSoFar: "Ahorrado hasta hoy",
    goal: "Meta: $1,135 este año",
    hi: "Hola, Maria",
    greeting: "¡Buenas noches!",
    promo: "La promo de Capital One termina en 41 días",
    newCall: "Nueva llamada",
  },
};

const menu = [
  { icon: "icon-grid", w: 13.3333, h: 13.3333, active: true },
  { icon: "icon-card", w: 14.6667, h: 10.6667 },
  { icon: "icon-phone", w: 14.5925, h: 14.6188 },
  { icon: "icon-layers", w: 14.667, h: 14.6667 },
  { icon: "icon-chart", w: 13.3333, h: 13.3333 },
  { icon: "icon-bell", w: 13.3334, h: 14.6702 },
];

// Left offset, bar height and color for each month, as placed in the 430 x 250 chart frame.
const bars: { left: number; h: number; tone: "grey" | "blue" | "tint" }[] = [
  { left: 0, h: 175, tone: "grey" },
  { left: 37, h: 174, tone: "grey" },
  { left: 74, h: 174, tone: "grey" },
  { left: 110, h: 173, tone: "grey" },
  { left: 147, h: 173, tone: "grey" },
  { left: 184, h: 127, tone: "blue" },
  { left: 221, h: 127, tone: "tint" },
  { left: 258, h: 126, tone: "tint" },
  { left: 295, h: 126, tone: "tint" },
  { left: 331, h: 126, tone: "tint" },
  { left: 368, h: 126, tone: "tint" },
  { left: 405, h: 125, tone: "tint" },
];
const barTone = { grey: "bg-[#dce2ec]", blue: "bg-hg-blue", tint: "bg-hg-blue-tint" };

function Pill({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return (
    <span className={`${caption} shrink-0 rounded-full px-3 py-1.5 whitespace-nowrap ${light ? "bg-white text-hg-ink" : "bg-hg-blue text-white"}`}>
      {children}
    </span>
  );
}

function Sidebar({ t }: { t: TabletCopy }) {
  return (
    <div className="flex h-full w-[210px] shrink-0 flex-col gap-1 border-r border-hg-line bg-white px-3.5 py-[22px]">
      <div className="flex items-center gap-2.5 px-1.5 pb-[18px]">
        <HgMark />
        <span className="text-[24px] leading-none font-bold tracking-[-0.05em] text-hg-ink">haggle</span>
      </div>
      {menu.map((item, i) => (
        <div
          key={item.icon}
          className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-[14px] leading-5 font-medium tracking-[-0.005em] ${
            item.active ? "bg-hg-blue-soft text-hg-blue" : "text-hg-ink-2"
          }`}
        >
          <HeroIcon name={item.icon} box={16} width={item.w} height={item.h} />
          {t.menu[i]}
        </div>
      ))}
      <div className="flex-1" />
      <div className="flex w-full items-center gap-2.5 rounded-[14px] bg-hg-surface p-2.5">
        <span className={`${caption} flex size-8 items-center justify-center rounded-2xl bg-hg-blue text-white`}>M</span>
        <div className={`${caption} flex flex-col whitespace-nowrap`}>
          <span className="text-hg-ink">Maria Lopez</span>
          <span className="text-hg-muted">{t.plan}</span>
        </div>
      </div>
    </div>
  );
}

function InterestChart({ t }: { t: TabletCopy }) {
  return (
    <div className="flex h-full min-w-0 flex-1 flex-col gap-3.5 rounded-[20px] bg-white p-5">
      <div className="flex w-full items-center gap-2.5">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5 whitespace-nowrap">
          <span className={`${h4} text-hg-ink`}>{t.chartTitle}</span>
          <span className={`${caption} text-hg-muted`}>Chase Freedom · 2026</span>
        </div>
        <Pill>{t.chartCut}</Pill>
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
              {t.months[i]}
            </span>
          </div>
        ))}
        <span className={`${caption} absolute top-[11px] left-[117px] rounded-[10px] bg-hg-ink px-2.5 py-1.5 whitespace-nowrap text-white`}>
          <ArrowText text={t.callTag} />
        </span>
      </div>
    </div>
  );
}

function YourCards({ t }: { t: TabletCopy }) {
  return (
    <div className="flex h-full w-[272px] shrink-0 flex-col gap-3 rounded-[20px] bg-white p-5">
      <span className={`${h4} text-hg-ink`}>{t.cards}</span>
      <div className="flex w-full flex-col gap-2 rounded-[14px] bg-hg-surface p-3.5">
        <div className="flex items-center justify-between">
          <span className={`${caption} whitespace-nowrap text-hg-ink`}>Chase Freedom · $8,400</span>
          <Pill>{t.won}</Pill>
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
          <Pill light>{t.next}</Pill>
        </div>
        <div className={`${caption} flex items-center gap-2 whitespace-nowrap text-hg-muted`}>
          <span>APR</span>
          <span className={`${h4} text-hg-ink`}>29.99%</span>
          <span>{t.fee}</span>
        </div>
      </div>
      <div className="flex-1" />
      <div className="flex w-full flex-col gap-1.5">
        <span className={`${caption} text-hg-muted`}>{t.savedSoFar}</span>
        <span className="text-[28px] leading-8 font-semibold tracking-[-0.02em] text-hg-blue">$609</span>
        <div className="h-2 w-full overflow-hidden rounded-[4px] bg-hg-surface">
          <div className="h-2 w-[124px] rounded-[4px] bg-hg-blue" />
        </div>
        <span className={`${caption} text-hg-muted`}>{t.goal}</span>
      </div>
    </div>
  );
}

export function HeroTablet({ locale = "en", className }: { locale?: Locale; className?: string }) {
  const t = COPY[locale];
  return (
    <div className={cn("flex h-[660px] w-[1040px] overflow-hidden rounded-[44px] bg-linear-to-b from-[#2b3446] to-hg-ink p-3", className)}>
      <div className="flex h-full flex-1 overflow-hidden rounded-[32px] bg-hg-surface">
        <Sidebar t={t} />
        <div className="flex h-full min-w-0 flex-1 flex-col gap-[18px] p-6">
          <div className="flex w-full items-center gap-3">
            <div className="flex min-w-0 flex-1 flex-col gap-0.5 font-semibold whitespace-nowrap">
              <span className={`${caption} text-hg-muted`}>{t.hi}</span>
              <span className="text-[24px] leading-[30px] tracking-[-0.02em] text-hg-ink">{t.greeting}</span>
            </div>
            <span className={`${caption} flex items-center gap-2 rounded-full border border-hg-line bg-white px-3 py-2 whitespace-nowrap text-hg-ink-2`}>
              <HeroIcon name="icon-bell-s" box={14} width={11.6668} height={12.8364} />
              {t.promo}
            </span>
            {/* A picture of a button: it lives in an aria-hidden, inert mockup, so it never takes focus. */}
            <HgButton href="/start" size="s" arrow>
              {t.newCall}
            </HgButton>
          </div>
          <div className="flex min-h-0 w-full flex-1 items-start gap-4">
            <InterestChart t={t} />
            <YourCards t={t} />
          </div>
        </div>
      </div>
    </div>
  );
}
