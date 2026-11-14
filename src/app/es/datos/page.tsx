import { InsightsIndexBody } from "@/components/insights/index-body";
import { insightsIndexMetadata } from "@/lib/benchmarks/meta";

export const metadata = insightsIndexMetadata("es");

export default function DatosIndex() {
  return <InsightsIndexBody lang="es" />;
}
