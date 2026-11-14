// "Your bank is one call away from yes" and the footer row: Figma node 7:276 on "Haggle — Landing · Desktop 1440".
import Image from "next/image";
import type { Copy, Locale } from "@/lib/i18n/locale";
import { HgButton, HgLogo, HgSection } from "./ui";
import { Reveal } from "@/components/motion/reveal";

const caption = "text-[13px] leading-[18px] font-semibold tracking-[-0.002em] text-hg-muted";

const COPY: Copy<{ title: string; lead: string; call: string; upload: string; disclaimer: string }> = {
  en: {
    title: "Your bank is one call away from yes",
    lead: "Upload a statement and see what you could save in two minutes",
    call: "Call my bank",
    upload: "Upload a statement",
    disclaimer: "Haggle isn’t a credit repair organization and never promises a specific score",
  },
  es: {
    title: "Tu banco está a una llamada de decir que sí",
    lead: "Sube un estado de cuenta y en dos minutos descubre cuánto podrías ahorrar",
    call: "Llamar a mi banco",
    upload: "Subir estado de cuenta",
    disclaimer: "Haggle no es una empresa de reparación de crédito y nunca promete un puntaje específico",
  },
};

/** A soft white cloud, drawn at its natural size (the SVG includes its blur margin). */
function Cloud({ name, width, height, style }: { name: string; width: number; height: number; style: React.CSSProperties }) {
  return (
    <Image
      src={`/landing/closing/cloud-${name}.svg`}
      alt=""
      width={width}
      height={height}
      className="pointer-events-none absolute block max-w-none"
      style={style}
    />
  );
}

export function Closing({ locale = "en" }: { locale?: Locale }) {
  const t = COPY[locale];
  return (
    <HgSection className="flex flex-col gap-2 px-4 pt-14 font-manrope min-[1440px]:px-0">
      <div className="relative isolate flex flex-col items-center gap-6 overflow-hidden rounded-[32px] bg-linear-to-b from-[#b4d6f3] via-[#e6f1fc] via-45% to-[#d4e4ff] px-6 pt-24 pb-[104px] sm:px-12">
        <div aria-hidden className="absolute inset-0 -z-10">
          <Image
            src="/landing/closing/glow.svg"
            alt=""
            width={1700}
            height={800}
            className="pointer-events-none absolute top-[118px] left-[calc(50%-850px)] block max-w-none"
          />
          <Cloud name="top-left" width={688} height={388} style={{ left: -224, top: -154 }} />
          <Cloud name="top-right" width={688} height={388} style={{ right: -216, top: -144 }} />
          <Cloud name="bottom-left" width={764} height={404} style={{ left: -252, top: 136 }} />
          <Cloud name="bottom-right" width={784} height={404} style={{ right: -264, top: 126 }} />
        </div>

        <Reveal as="h2" amount={0.6} className="max-w-[760px] text-center text-[clamp(32px,4.5vw,48px)] leading-[1.125] font-semibold tracking-[-0.035em] text-hg-ink">
          {t.title}
        </Reveal>
        <Reveal as="p" delay={0.1} amount={0.6} className="max-w-[560px] text-center text-[18px] leading-7 font-medium tracking-[-0.01em] text-hg-muted">
          {t.lead}
        </Reveal>
        <Reveal delay={0.2} amount={0.6} className="flex flex-wrap justify-center gap-3">
          <HgButton href="/start" arrow>
            {t.call}
          </HgButton>
          <HgButton href="/start" tone="dark">
            {t.upload}
          </HgButton>
        </Reveal>

        {/* 3D coins and shield sit on the card's outer edges; smaller between md and xl, hidden on phones. */}
        <div
          aria-hidden
          className="pointer-events-none absolute top-[150px] left-[-80px] hidden size-[382.29px] origin-top-left scale-[0.55] items-center justify-center md:flex xl:top-[50px] xl:left-[-57px] xl:scale-100"
        >
          <Image src="/landing/closing/coins-3d.png" alt="" width={330} height={330} sizes="330px" className="hg-float block size-[330px] max-w-none rotate-10" />
        </div>
        <div
          aria-hidden
          className="pointer-events-none absolute top-[150px] right-[-100px] hidden size-[379.54px] origin-top-right scale-[0.55] items-center justify-center md:flex xl:top-[61.47px] xl:right-[-79.54px] xl:scale-100"
        >
          <Image src="/landing/closing/shield-3d.png" alt="" width={320} height={320} sizes="320px" className="hg-float block size-[320px] max-w-none -rotate-12" style={{ animationDelay: "-3s" }} />
        </div>
      </div>

      <footer className="flex flex-col items-center gap-4 px-6 pt-6 pb-2 text-center lg:flex-row lg:justify-between lg:text-left">
        <HgLogo locale={locale} />
        <p className={caption}>{t.disclaimer}</p>
        <p className={`${caption} whitespace-nowrap`}>© 2026 Haggle</p>
      </footer>
    </HgSection>
  );
}
