// "Be the bank, we'll call you": the blue demo band from Figma node 6:78. The button opens /demo, where
// the visitor types their own phone number and Haggle rings it (or they type the call instead).
// The 3D phone from the design is replaced by a short recording of a real practice call (demo-video.tsx).
import Image from "next/image";
import type { Copy, Locale } from "@/lib/i18n/locale";
import { DemoVideo } from "./demo-video";
import { HgButton, HgSection } from "./ui";
import { Reveal } from "@/components/motion/reveal";

const COPY: Copy<{ title: string; lead: string; cta: string; note: string; video: string }> = {
  en: {
    title: "Be the bank, we’ll call you",
    lead: "Type your number and Haggle rings your phone for real. Play the Chase rep, try to say no, and watch the transcript live on screen",
    cta: "Call my phone",
    note: "A practice call with sample data, to +1 and +7 numbers. No phone handy? Type the call in your browser.",
    video: "Recorded from a real practice call with sample data. A person played Chase using the suggested replies.",
  },
  es: {
    title: "Tú eres el banco, nosotros te llamamos",
    lead: "Escribe tu número y Haggle llama de verdad a tu teléfono. Haz de agente de Chase, intenta decir que no y mira la transcripción en vivo",
    cta: "Llamar a mi teléfono",
    note: "Una llamada de práctica con datos de ejemplo, a números +1 y +7. ¿Sin teléfono a mano? Escribe la llamada en tu navegador.",
    video: "Grabado de una llamada de práctica real con datos de muestra. Una persona hizo de Chase con las respuestas sugeridas.",
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
          <HgButton href="/demo" tone="white" arrow>
            {t.cta}
          </HgButton>
          <p className="text-[13px] leading-[18px] font-semibold tracking-[-0.002em] text-white/65">{t.note}</p>
        </div>
        <figure className="relative mx-auto flex w-full max-w-[300px] shrink-0 flex-col items-center gap-3 lg:mx-0 lg:w-[320px] lg:max-w-[320px]">
          <DemoVideo locale={locale} className="w-full" />
          <figcaption className="text-center text-[12px] leading-4 font-semibold text-white/65">{t.video}</figcaption>
        </figure>
      </Reveal>
    </HgSection>
  );
}
