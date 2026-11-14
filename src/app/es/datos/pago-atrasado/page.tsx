import { TopicBody } from "@/components/insights/topic-page";
import { insightsTopicMetadata } from "@/lib/benchmarks/meta";

export const metadata = insightsTopicMetadata("missed-payment", "es");

export default function PagoAtrasadoPage() {
  return <TopicBody slug="missed-payment" lang="es" />;
}
