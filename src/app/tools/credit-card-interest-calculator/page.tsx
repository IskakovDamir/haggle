import { CalculatorPageBody } from "@/components/calculator/calculator-page";
import { calculatorMetadata } from "@/lib/benchmarks/meta";

export const metadata = calculatorMetadata("en");

export default function InterestCalculatorPage() {
  return <CalculatorPageBody lang="en" description={String(metadata.description)} />;
}
