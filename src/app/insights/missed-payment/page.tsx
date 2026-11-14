import { TopicBody } from "@/components/insights/topic-page";
import { insightsTopicMetadata } from "@/lib/benchmarks/meta";

export const metadata = insightsTopicMetadata("missed-payment", "en");

export default function MissedPaymentPage() {
  return <TopicBody slug="missed-payment" lang="en" />;
}
