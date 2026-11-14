// The landing's "Stats" row (Figma 13:194) carrying cited market numbers: four cards, each with a 3D render in the corner.
import Image from "next/image";
import type { Stat } from "@/lib/benchmarks/types";
import { formatStatValue } from "@/lib/benchmarks";
import type { Locale } from "@/lib/i18n/locale";
import { cn } from "@/lib/utils";
import { Provenance } from "./provenance";

const LOOKS = [
  { bg: "linear-gradient(133.83deg, #1e2740 14.286%, #0b1220 85.714%)", dark: true, art: "/landing/stats/3d-gift.png", rotate: 8 },
  { bg: "linear-gradient(133.83deg, #2448f0 14.286%, #2f6bff 57.143%, #8db6ff 85.714%)", dark: true, art: "/landing/stats/3d-card.png", rotate: 14 },
  { bg: "linear-gradient(133.83deg, #f4f6fa 14.286%, #f4f6fa 85.714%)", dark: false, art: "/landing/stats/3d-headphones.png", rotate: 4.5 },
  { bg: "linear-gradient(133.83deg, #c4ddf6 14.286%, #eaf3fe 85.714%)", dark: false, art: "/landing/stats/3d-coins.png", rotate: 0 },
];

export function StatCards({ stats, lang = "en" }: { stats: Stat[]; lang?: Locale }) {
  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat, i) => {
        const look = LOOKS[i % LOOKS.length];
        return (
          <li
            key={stat.id}
            className="relative isolate flex min-h-[260px] flex-col gap-1.5 overflow-hidden rounded-[28px] p-7"
            style={{ backgroundImage: look.bg }}
          >
            <p className={cn("text-[44px] leading-12 font-semibold tracking-[-0.03em] tabular-nums", look.dark ? "text-white" : "text-hg-ink")}>
              {formatStatValue(stat)}
            </p>
            <p className={cn("max-w-[210px] text-[14px] leading-5 font-medium tracking-[-0.005em]", look.dark ? "text-white/80" : "text-hg-ink-2")}>
              {stat.label}
            </p>
            <p className="mt-auto max-w-[200px] text-[12px] leading-4 font-medium">
              <Provenance stat={stat} tone={look.dark ? "dark" : "light"} withDate lang={lang} />
            </p>
            <span aria-hidden className="hg-float pointer-events-none absolute -right-10 -bottom-12 -z-10 size-[190px]" style={{ animationDelay: `${i * -1.4}s` }}>
              <Image src={look.art} alt="" fill sizes="190px" className="object-contain" style={{ rotate: `${look.rotate}deg` }} />
            </span>
          </li>
        );
      })}
    </ul>
  );
}
