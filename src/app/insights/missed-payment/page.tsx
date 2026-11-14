import { Timeline } from "@/components/insights/blocks";
import { SectionTitle, sectionPad } from "@/components/insights/chrome";
import { TopicPage, topicMetadata } from "@/components/insights/topic-page";
import { HgSection } from "@/components/landing-v2/ui";
import { MISSED_PAYMENT_TIMELINE, getTopic } from "@/lib/benchmarks";
import { missedPaymentFaq } from "@/lib/benchmarks/faq";
import { cn } from "@/lib/utils";

const topic = getTopic("missed-payment")!;

export const metadata = topicMetadata(topic);

export default function MissedPaymentPage() {
  return (
    <TopicPage
      topic={topic}
      h1={
        <>
          Missed a credit card payment? <em>Here is how to get the fee back</em>
        </>
      }
      lead="A late fee is often the easiest thing to get back. Most people who ask get it waived. Here is what happens after a missed payment, and how five big banks compare."
      art="/landing/wins/3d-bell.png"
      marketStatIds={["market-late-fee-waived", "market-late-fee-cap-first", "market-late-fee-cap-repeat", "market-annual-fee-waived"]}
      metrics={["lateFeeRefundRate", "lateFeeMax", "waitToPerson", "satisfaction"]}
      faq={missedPaymentFaq()}
    >
      <HgSection className={cn("flex flex-col gap-8 py-12", sectionPad)}>
        <SectionTitle title="What happens after a missed payment" lead="The same federal rules apply at every big card issuer." />
        <Timeline steps={MISSED_PAYMENT_TIMELINE} />
      </HgSection>
    </TopicPage>
  );
}
