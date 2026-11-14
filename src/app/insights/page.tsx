import { InsightsIndexBody } from "@/components/insights/index-body";
import { insightsIndexMetadata } from "@/lib/benchmarks/meta";

export const metadata = insightsIndexMetadata("en");

export default function InsightsIndex() {
  return <InsightsIndexBody lang="en" />;
}
