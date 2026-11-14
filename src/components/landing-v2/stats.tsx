// Stats row from the Figma frame "Stats" (13:194): four cards, each with a 3D object tucked into the corner.
import Image from "next/image";
import { HgSection } from "./ui";

type Stat = {
  value: string;
  label: string;
  bg: React.CSSProperties;
  dark: boolean;
  labelColor: string;
  // The 3D render, its size and rotation. Pinned to the card's right edge so it stays in the corner at any width.
  art: { src: string; size: number; rotate: number; right: number; top: number };
};

const stats: Stat[] = [
  {
    value: "94%",
    label: "of annual fee waiver requests succeed",
    bg: { backgroundImage: "linear-gradient(133.83deg, #1e2740 14.286%, #0b1220 85.714%)" },
    dark: true,
    labelColor: "text-white/70",
    art: { src: "3d-gift", size: 210, rotate: 8, right: -16.36, top: 130.6 },
  },
  {
    value: "$609",
    label: "a year saved on one card from a single call",
    bg: { backgroundImage: "linear-gradient(133.83deg, #2448f0 14.286%, #2f6bff 57.143%, #8db6ff 85.714%)" },
    dark: true,
    labelColor: "text-white/80",
    art: { src: "3d-card", size: 299.908, rotate: 14, right: -114.74, top: 71.82 },
  },
  {
    value: "40 min",
    label: "on hold that you never sit through",
    bg: { backgroundColor: "#f4f6fa" },
    dark: false,
    labelColor: "text-[#5b6475]",
    art: { src: "3d-headphones", size: 210, rotate: 4.51, right: -42.4, top: 108.45 },
  },
  {
    value: "$1,135",
    label: "saved in a typical year with Haggle",
    bg: { backgroundImage: "linear-gradient(133.83deg, #c4ddf6 14.286%, #eaf3fe 85.714%)" },
    dark: false,
    labelColor: "text-hg-ink-2",
    art: { src: "3d-coins", size: 210, rotate: 0, right: -32, top: 120 },
  },
];

function StatCard({ stat }: { stat: Stat }) {
  const { art } = stat;
  return (
    <li className="relative flex h-[300px] flex-col gap-1.5 overflow-hidden rounded-[28px] p-7" style={stat.bg}>
      <p className={`relative text-[40px] leading-11 font-semibold tracking-[-0.03em] ${stat.dark ? "text-white" : "text-hg-ink"}`}>
        {stat.value}
      </p>
      <p className={`relative w-full max-w-[190px] text-[14px] leading-5 font-medium tracking-[-0.005em] ${stat.labelColor}`}>{stat.label}</p>
      <Image
        src={`/landing/stats/${art.src}.png`}
        alt=""
        width={art.size}
        height={art.size}
        sizes={`${Math.ceil(art.size)}px`}
        className="pointer-events-none absolute max-w-none object-contain"
        style={{ right: art.right, top: art.top, width: art.size, height: art.size, rotate: `${art.rotate}deg` }}
      />
    </li>
  );
}

export function Stats() {
  return (
    <HgSection className="px-4 pt-14 pb-6 font-manrope sm:px-6 xl:px-[104px]">
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.value} stat={stat} />
        ))}
      </ul>
    </HgSection>
  );
}
