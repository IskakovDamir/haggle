// "Questions you might have": Figma node 7:220 on "Haggle — Landing · Desktop 1440".
import Image from "next/image";
import { FaqAccordion, type FaqEntry } from "./faq-accordion";
import { BlobPanel } from "./pricing-panel";
import { HgButton, HgSection } from "./ui";
import { Reveal } from "@/components/motion/reveal";

const questions: FaqEntry[] = [
  {
    question: "Will a bank actually talk to an AI?",
    answer:
      "On a real call, Haggle would get through the phone menu and wait on hold, then bring you in on a three-way call to verify, after that the agent would talk with your recorded consent. In this build every call is a practice call where you play the bank.",
  },
  {
    question: "Is it legal for an AI to call and record?",
    answer:
      "Haggle is upfront about both. The agent always opens by saying it is an AI assistant calling on your behalf and that the call is recorded. In this build no real bank is called: you play the bank on a practice call.",
  },
  {
    question: "Do you need my bank login?",
    answer:
      "No. Haggle works from your credit card statement. It never asks for a bank login or a full card number, and it keeps only the last four digits of your card.",
  },
  {
    question: "What if the bank says no?",
    answer:
      "Then you pay nothing. The agent asks once for the retention team before it takes no for an answer, and Haggle shows you what to try next and when.",
  },
  {
    question: "How do you count what I saved?",
    answer:
      "We add up what the new terms save you in the first year: the interest you no longer pay on your balance at the lower APR, plus any fee the bank waives or refunds. Haggle’s fee is 20% of that, charged only after a confirmed win.",
  },
];

export function Faq() {
  return (
    <HgSection id="faq" className="px-4 pt-14 pb-10 font-manrope sm:px-8 lg:px-10 xl:px-[104px]">
      <BlobPanel dir="faq" angle={155.14} bottoms={{ center: -176, left: -106 }} className="px-5 py-8 sm:px-8 lg:min-h-[556px] lg:py-10 lg:pr-7 lg:pl-10">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-16">
          <Reveal amount={0.4} className="flex shrink-0 flex-col items-start gap-5 lg:w-[320px] xl:w-[400px]">
            <h2 className="text-[clamp(32px,4.5vw,48px)] leading-[1.125] font-semibold tracking-[-0.035em] text-hg-ink">
              Questions you might have
            </h2>
            <p className="text-[18px] leading-7 font-medium tracking-[-0.01em] text-hg-muted">
              Straight answers about banks, calls, your data and money
            </p>
            <HgButton href="/start" size="s" arrow>
              Ask us anything
            </HgButton>
          </Reveal>
          <FaqAccordion items={questions} />
        </div>

        {/* 3D padlock, under the intro on wide screens. Decorative, so it steps aside when the layout stacks. */}
        <div aria-hidden className="pointer-events-none absolute bottom-[-15.2px] left-[124.85px] hidden size-[301.2px] items-center justify-center lg:flex">
          <Image src="/landing/faq/padlock-3d.png" alt="" width={260} height={260} sizes="260px" className="hg-float block size-[260px] max-w-none rotate-10" />
        </div>
      </BlobPanel>
    </HgSection>
  );
}
