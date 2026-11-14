import Link from "next/link";
import { sectionPad } from "@/components/insights/chrome";
import { TopicPage, topicMetadata } from "@/components/insights/topic-page";
import { HgSection } from "@/components/landing-v2/ui";
import { cn } from "@/lib/utils";
import { getTopic } from "@/lib/benchmarks";
import { lowerAprFaq } from "@/lib/benchmarks/faq";

const topic = getTopic("lower-apr")!;

export const metadata = topicMetadata(topic);

export default function LowerAprPage() {
  return (
    <TopicPage
      topic={topic}
      h1={
        <>
          How to get a lower credit card APR, <em>bank by bank</em>
        </>
      }
      lead="Most cardholders who ask for a lower rate get one. Banks keep retention teams for exactly this call. Here is how often it works, and how five big banks compare."
      art="/landing/wins/3d-arrow-down.png"
      marketStatIds={["market-apr-ask-success", "market-apr-cut", "market-average-apr", "market-card-balances"]}
      metrics={["typicalAprCut", "waitToPerson", "satisfaction", "lateFeeRefundRate"]}
      faq={lowerAprFaq()}
    >
      <HgSection className={cn("py-6", sectionPad)}>
        <Link
          href="/tools/credit-card-interest-calculator"
          className="flex flex-col gap-2 rounded-[28px] bg-hg-ink p-7 transition-transform duration-300 hover:-translate-y-0.5 sm:flex-row sm:items-center sm:justify-between"
        >
          <span className="text-[22px] leading-7 font-semibold tracking-[-0.03em] text-white">
            What would a cut save you? <span className="text-white/55">Try the interest calculator.</span>
          </span>
          <span className="text-[13px] leading-[18px] font-semibold tracking-[0.04em] whitespace-nowrap text-white uppercase">Open the calculator</span>
        </Link>
      </HgSection>
    </TopicPage>
  );
}
