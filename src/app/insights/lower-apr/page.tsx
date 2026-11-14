import { TopicPage, topicMetadata } from "@/components/insights/topic-page";
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
    />
  );
}
