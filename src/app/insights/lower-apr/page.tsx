import { TopicBody } from "@/components/insights/topic-page";
import { insightsTopicMetadata } from "@/lib/benchmarks/meta";

export const metadata = insightsTopicMetadata("lower-apr", "en");

export default function LowerAprPage() {
  return <TopicBody slug="lower-apr" lang="en" />;
}
