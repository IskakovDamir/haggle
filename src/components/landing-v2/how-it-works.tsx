// "From statement to phone call": six numbered step tiles, from Figma node 5:130.
import Image from "next/image";
import { Stagger, StaggerItem } from "@/components/motion/reveal";
import type { Copy, Locale } from "@/lib/i18n/locale";
import { cn } from "@/lib/utils";
import { HgHeading, HgSection } from "./ui";

type Who = "you" | "haggle" | "both";

type StepText = { who: string; title: string; titleSoft: string; body: string };

type Step = StepText & {
  n: string;
  whoTone: Who;
  /** Distance from the big number's left edge to the tile's right edge in Figma, so it bleeds off the same way at any width. */
  numberInset: number;
};

const LAYOUT: Pick<Step, "n" | "whoTone" | "numberInset">[] = [
  { n: "01", whoTone: "you", numberInset: 108.33 },
  { n: "02", whoTone: "haggle", numberInset: 128.33 },
  { n: "03", whoTone: "you", numberInset: 126.33 },
  { n: "04", whoTone: "both", numberInset: 130.33 },
  { n: "05", whoTone: "you", numberInset: 126.33 },
  { n: "06", whoTone: "haggle", numberInset: 131.33 },
];

type HowCopy = {
  title: string;
  lead: string;
  /** One entry per tile, in the same order as `LAYOUT`. Titles stay on one line each; bodies fit in two or three lines. */
  steps: [StepText, StepText, StepText, StepText, StepText, StepText];
};

const COPY: Copy<HowCopy> = {
  en: {
    title: "From statement to phone call",
    lead: "You upload a statement and say yes on the call, Haggle does everything in between",
    steps: [
      { who: "You", title: "Upload a", titleSoft: "statement", body: "A PDF or a photo, we pull rates, balances and due dates" },
      { who: "Haggle", title: "See what", titleSoft: "you lose", body: "$3,313 a year in interest and fees, priced lever by lever" },
      { who: "You approve", title: "Pick your", titleSoft: "plan", body: "Rate cut, fee waiver, limit increase, then a 0% transfer" },
      { who: "Haggle + you", title: "Haggle calls", titleSoft: "the bank", body: "Waits on hold, then brings you in to verify it’s you" },
      { who: "You", title: "Pay only", titleSoft: "on a win", body: "Billed only after the bank says yes" },
      { who: "Haggle", title: "We keep", titleSoft: "watching", body: "A promo ending or a rate hike triggers a new call" },
    ],
  },
  es: {
    title: "Del estado de cuenta a la llamada",
    lead: "Tú subes un estado de cuenta y dices que sí en la llamada. Haggle hace todo lo demás",
    steps: [
      { who: "Tú", title: "Sube tu", titleSoft: "estado de cuenta", body: "Un PDF o una foto: leemos tasas, saldos y fechas de pago" },
      { who: "Haggle", title: "Mira lo que", titleSoft: "estás perdiendo", body: "$3,313 al año en intereses y cargos, opción por opción" },
      { who: "Tú apruebas", title: "Elige tu", titleSoft: "plan", body: "Tasa menor, sin cuota, más límite y una transferencia al 0%" },
      { who: "Haggle + tú", title: "Haggle llama", titleSoft: "a tu banco", body: "Espera en línea y te conecta para confirmar que eres tú" },
      { who: "Tú", title: "Pagas solo", titleSoft: "si ganas", body: "Solo te cobramos cuando el banco dice que sí" },
      { who: "Haggle", title: "Seguimos", titleSoft: "vigilando", body: "Si se acaba una promo o sube la tasa, volvemos a llamar" },
    ],
  },
};

const PILL: Record<Who, string> = {
  you: "border border-hg-blue-tint bg-white text-hg-blue",
  haggle: "bg-hg-ink text-white",
  both: "bg-white/20 text-white",
};

function StepTile({ step }: { step: Step }) {
  const blue = step.whoTone === "both";
  return (
    <div
      className={cn(
        "relative flex h-[224px] flex-col overflow-hidden rounded-[28px] p-7 transition-[transform,box-shadow] duration-300 ease-out group-hover:-translate-y-1 group-hover:shadow-[0_20px_40px_-24px_rgb(47_107_255/0.5)] [&>span:first-child]:transition-transform [&>span:first-child]:duration-500 group-hover:[&>span:first-child]:-translate-x-2",
        blue
          ? "bg-[linear-gradient(148.95deg,#2448f0_14.286%,#2f6bff_57.143%,#8db6ff_85.714%)]"
          : "border border-hg-line bg-linear-to-b from-[#e6f0fd] to-[#f7faff]",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "absolute text-[120px] leading-[120px] font-semibold tracking-[-0.06em] whitespace-nowrap select-none",
          blue ? "top-[126px] text-white/20" : "top-[125px] text-[#d6e3fa]",
        )}
        style={{ left: `calc(100% - ${step.numberInset}px)` }}
      >
        {step.n}
      </span>
      <div className="relative flex w-[196px] max-w-full flex-col items-start gap-3">
        <span className={cn("rounded-full px-2.5 py-[5px] text-[13px] leading-[18px] font-semibold tracking-[-0.002em] whitespace-nowrap", PILL[step.whoTone])}>
          {step.who}
        </span>
        <h3 className="text-[24px] leading-[30px] font-semibold tracking-[-0.02em] whitespace-nowrap">
          <span className={cn("block", blue ? "text-white" : "text-hg-ink")}>{step.title}</span>
          <span className={cn("block", blue ? "text-white/60" : "text-[#9aa3b2]")}>{step.titleSoft}</span>
        </h3>
        <p className={cn("text-[14px] leading-5 font-medium tracking-[-0.005em]", blue ? "text-white/80" : "text-[#5b6475]")}>{step.body}</p>
      </div>
    </div>
  );
}

export function HowItWorks({ locale = "en" }: { locale?: Locale }) {
  const copy = COPY[locale];
  const steps: Step[] = LAYOUT.map((layout, i) => ({ ...layout, ...copy.steps[i] }));
  return (
    <HgSection id="how" className="flex flex-col items-center gap-8 px-4 pt-14 pb-10 font-manrope sm:px-8 lg:px-12 xl:px-[104px]">
      <HgHeading
        title={copy.title}
        lead={copy.lead}
        className="[&_h2]:max-w-[900px] [&_p]:max-w-[900px] [&_p]:text-[18px] [&_p]:leading-7 [&_p]:tracking-[-0.01em] [&_p]:text-hg-muted"
      />
      <Stagger as="ol" gap={0.09} className="grid w-full max-w-[1200px] grid-cols-1 gap-x-10 gap-y-6 md:grid-cols-2 lg:grid-cols-3">
        {steps.map((step, i) => (
          <StaggerItem as="li" key={step.n} className="group relative">
            <StepTile step={step} />
            {/* Arrow between neighbours in a row of three; hidden when the grid wraps differently. */}
            {i % 3 !== 2 && (
              <span
                aria-hidden
                className="absolute top-24 left-full z-10 ml-1 hidden size-8 items-center justify-center rounded-2xl bg-hg-ink lg:flex"
              >
                <Image src="/landing/how/arrow-right.svg" alt="" width={9.56667} height={9.56667} unoptimized />
              </span>
            )}
          </StaggerItem>
        ))}
      </Stagger>
    </HgSection>
  );
}
