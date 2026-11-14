import { CalculatorPageBody } from "@/components/calculator/calculator-page";
import { calculatorMetadata } from "@/lib/benchmarks/meta";

export const metadata = calculatorMetadata("es");

export default function CalculadoraPage() {
  return <CalculatorPageBody lang="es" description={String(metadata.description)} />;
}
