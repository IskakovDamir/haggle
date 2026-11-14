import { TopicBody } from "@/components/insights/topic-page";
import { insightsTopicMetadata } from "@/lib/benchmarks/meta";

export const metadata = insightsTopicMetadata("lower-apr", "es");

export default function BajarLaTasaPage() {
  return <TopicBody slug="lower-apr" lang="es" />;
}
