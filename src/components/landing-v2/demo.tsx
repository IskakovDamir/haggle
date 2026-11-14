// "Be the bank, we'll call you": the blue demo band with the 3D phone, from Figma node 6:78.
// The design has a phone-number form; this build can't place real calls, so it links to the in-browser practice call.
import Image from "next/image";
import type { Copy, Locale } from "@/lib/i18n/locale";
import { HgButton, HgSection } from "./ui";
import { Reveal } from "@/components/motion/reveal";

const COPY: Copy<{ title: string; lead: string; cta: string; note: string }> = {
  en: {
    title: "Be the bank, we’ll call you",
    lead: "Play a Chase rep and try to say no, then watch the transcript live on screen",
    cta: "Try a demo call",
    note: "A practice call in your browser: you play the bank and the agent negotiates with you.",
  },
  es: {
    title: "Tú eres el banco, nosotros te llamamos",
    lead: "Hazte pasar por un agente de Chase e intenta decir que no, mientras ves la transcripción en vivo",
    cta: "Prueba una llamada demo",
    note: "Una llamada de práctica en tu navegador: tú haces de banco y el agente negocia contigo.",
  },
};

export function Demo({ locale = "en" }: { locale?: Locale }) {
  const t = COPY[locale];
  return (
    <HgSection id="demo" className="flex flex-col items-center px-4 py-14 font-manrope sm:px-8 lg:px-12 xl:px-[104px]">
      <Reveal y={40} amount={0.2} className="relative flex w-full max-w-[1200px] flex-col items-stretch gap-8 overflow-hidden rounded-[40px] bg-linear-to-r from-[#1a3fd6] to-[#3a76ff] px-6 pt-10 pb-6 sm:px-10 lg:flex-row lg:items-center lg:gap-12 lg:py-14 lg:pr-14 lg:pl-16">
        <Image
          src="/landing/demo/blob.svg"
          alt=""
          aria-hidden
          unoptimized
          width={800}
          height={560}
          className="pointer-events-none absolute top-[-260px] left-[48.33%] block h-[560px] w-[800px] max-w-none"
        />
        <div className="relative flex min-w-0 flex-1 flex-col items-start gap-6">
          <h2 className="text-[clamp(32px,4.5vw,48px)] leading-[1.125] font-semibold tracking-[-0.035em] text-white">{t.title}</h2>
          <p className="text-[18px] leading-7 font-medium tracking-[-0.01em] text-white/78">{t.lead}</p>
          <HgButton href="/start?sample=maria-chase" tone="white" arrow>
            {t.cta}
          </HgButton>
          <p className="text-[13px] leading-[18px] font-semibold tracking-[-0.002em] text-white/65">{t.note}</p>
        </div>
        {/* In the row layout this is the 360px "Phone space"; the phone itself hangs off the banner's right edge as in Figma. */}
        <div className="relative size-[240px] shrink-0 self-center lg:static lg:h-[10px] lg:w-[360px]">
          <div className="hg-float absolute inset-0 flex items-center justify-center lg:inset-auto lg:top-[25px] lg:right-[54.63px] lg:size-[316.368px]">
            <Image
              src="/landing/demo/3d-phone.png"
              alt=""
              width={300}
              height={300}
              className="size-[227px] max-w-none rotate-[-176.7deg] -scale-y-100 object-contain lg:size-[299.608px]"
            />
          </div>
        </div>
      </Reveal>
    </HgSection>
  );
}
