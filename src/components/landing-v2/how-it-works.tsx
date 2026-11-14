// "From statement to phone call": six numbered step tiles, from Figma node 5:130.
import Image from "next/image";
import { cn } from "@/lib/utils";
import { HgHeading, HgSection } from "./ui";

type Who = "you" | "haggle" | "both";

type Step = {
  n: string;
  who: string;
  whoTone: Who;
  title: string;
  titleSoft: string;
  body: string;
  /** Distance from the big number's left edge to the tile's right edge in Figma, so it bleeds off the same way at any width. */
  numberInset: number;
};

const STEPS: Step[] = [
  { n: "01", who: "You", whoTone: "you", title: "Upload a", titleSoft: "statement", body: "A PDF or a photo, we pull rates, balances and due dates", numberInset: 108.33 },
  { n: "02", who: "Haggle", whoTone: "haggle", title: "See what", titleSoft: "you lose", body: "$3,313 a year in interest and fees, priced lever by lever", numberInset: 128.33 },
  { n: "03", who: "You approve", whoTone: "you", title: "Pick your", titleSoft: "plan", body: "Rate cut, fee waiver, limit increase, then a 0% transfer", numberInset: 126.33 },
  { n: "04", who: "Haggle + you", whoTone: "both", title: "Haggle calls", titleSoft: "the bank", body: "Waits on hold, then brings you in to verify it’s you", numberInset: 130.33 },
  { n: "05", who: "You", whoTone: "you", title: "Pay only", titleSoft: "on a win", body: "Billed only after the bank says yes", numberInset: 126.33 },
  { n: "06", who: "Haggle", whoTone: "haggle", title: "We keep", titleSoft: "watching", body: "A promo ending or a rate hike triggers a new call", numberInset: 131.33 },
];

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
        "relative flex h-[224px] flex-col overflow-hidden rounded-[28px] p-7",
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

export function HowItWorks() {
  return (
    <HgSection id="how" className="flex flex-col items-center gap-8 px-4 pt-14 pb-10 font-manrope sm:px-8 lg:px-12 xl:px-[104px]">
      <HgHeading
        title="From statement to phone call"
        lead="You upload a statement and say yes on the call, Haggle does everything in between"
        className="[&_h2]:max-w-[900px] [&_p]:max-w-[900px] [&_p]:text-[18px] [&_p]:leading-7 [&_p]:tracking-[-0.01em] [&_p]:text-hg-muted"
      />
      <ol className="grid w-full max-w-[1200px] grid-cols-1 gap-x-10 gap-y-6 md:grid-cols-2 lg:grid-cols-3">
        {STEPS.map((step, i) => (
          <li key={step.n} className="relative">
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
          </li>
        ))}
      </ol>
    </HgSection>
  );
}
