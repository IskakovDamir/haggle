// Stats row from the Figma frame "Stats" (13:194): four cards, each with a 3D object tucked into the corner.
import Image from "next/image";
import { Stagger, StaggerItem } from "@/components/motion/reveal";
import type { Copy, Locale } from "@/lib/i18n/locale";
import { HgSection } from "./ui";

type Stat = {
  value: string;
  bg: React.CSSProperties;
  dark: boolean;
  labelColor: string;
  // The 3D render, its size and rotation. Pinned to the card's right edge so it stays in the corner at any width.
  art: { src: string; size: number; rotate: number; right: number; top: number };
};

/** One label per card, in the same order as `stats`. */
const LABELS: Copy<[string, string, string, string]> = {
  en: [
    "of annual fee waiver requests succeed",
    "a year saved on one card from a single call",
    "on hold that you never sit through",
    "saved in a typical year with Haggle",
  ],
  es: [
    "de las solicitudes para quitar la cuota anual se aprueban",
    "al año ahorrados en una tarjeta con una sola llamada",
    "en espera que nunca tienes que aguantar",
    "ahorrados en un año típico con Haggle",
  ],
};

const stats: Stat[] = [
  {
    value: "94%",
    bg: { backgroundImage: "linear-gradient(133.83deg, #1e2740 14.286%, #0b1220 85.714%)" },
    dark: true,
    labelColor: "text-white/70",
    art: { src: "3d-gift", size: 210, rotate: 8, right: -16.36, top: 130.6 },
  },
  {
    value: "$609",
    bg: { backgroundImage: "linear-gradient(133.83deg, #2448f0 14.286%, #2f6bff 57.143%, #8db6ff 85.714%)" },
    dark: true,
    labelColor: "text-white/80",
    art: { src: "3d-card", size: 299.908, rotate: 14, right: -114.74, top: 71.82 },
  },
  {
    value: "40 min",
    bg: { backgroundColor: "#f4f6fa" },
    dark: false,
    labelColor: "text-[#5b6475]",
    art: { src: "3d-headphones", size: 210, rotate: 4.51, right: -42.4, top: 108.45 },
  },
  {
    value: "$1,135",
    bg: { backgroundImage: "linear-gradient(133.83deg, #c4ddf6 14.286%, #eaf3fe 85.714%)" },
    dark: false,
    labelColor: "text-hg-ink-2",
    art: { src: "3d-coins", size: 210, rotate: 0, right: -32, top: 120 },
  },
];

function StatCard({ stat, label, index }: { stat: Stat; label: string; index: number }) {
  const { art } = stat;
  return (
    <StaggerItem
      as="li"
      className="group relative flex h-[300px] flex-col gap-1.5 overflow-hidden rounded-[28px] p-7 transition-shadow duration-300 hover:shadow-[0_24px_48px_-24px_rgb(11_18_32/0.45)]"
    >
      <span aria-hidden className="absolute inset-0" style={stat.bg} />
      <p className={`relative text-[40px] leading-11 font-semibold tracking-[-0.03em] ${stat.dark ? "text-white" : "text-hg-ink"}`}>
        {stat.value}
      </p>
      <p className={`relative w-full max-w-[190px] text-[14px] leading-5 font-medium tracking-[-0.005em] ${stat.labelColor}`}>{label}</p>
      <span
        aria-hidden
        className="hg-float pointer-events-none absolute"
        style={{ right: art.right, top: art.top, width: art.size, height: art.size, animationDelay: `${index * -1.4}s` }}
      >
        <Image
          src={`/landing/stats/${art.src}.png`}
          alt=""
          width={art.size}
          height={art.size}
          sizes={`${Math.ceil(art.size)}px`}
          className="size-full max-w-none object-contain transition-transform duration-500 ease-out group-hover:scale-110"
          style={{ rotate: `${art.rotate}deg` }}
        />
      </span>
    </StaggerItem>
  );
}

export function Stats({ locale = "en" }: { locale?: Locale }) {
  return (
    <HgSection className="px-4 pt-14 pb-6 font-manrope sm:px-6 xl:px-[104px]">
      <Stagger as="ul" gap={0.1} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <StatCard key={stat.value} stat={stat} label={LABELS[locale][i]} index={i} />
        ))}
      </Stagger>
    </HgSection>
  );
}
