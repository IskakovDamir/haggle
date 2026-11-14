// The engine names each savings line in English ("Late fee refunded"). This puts the known lines into
// the visitor's language at the screen's edge. Figures inside a label are carried over exactly as written.
import type { Locale } from "@/lib/i18n/locale";

const EXACT_ES: Record<string, string> = {
  "Annual fee waived": "Cuota anual eliminada",
  "Late fee refunded": "Cargo por pago tardío devuelto",
  "Statement credit": "Crédito en el estado de cuenta",
};

const PATTERNS_ES: [RegExp, (...parts: string[]) => string][] = [
  [/^APR lowered from (\S+) to (\S+)$/, (before, after) => `APR reducido de ${before} a ${after}`],
];

/** A savings line's label in the visitor's language. A label this does not know stays in English. */
export function savingsLineLabel(label: string, locale: Locale): string {
  if (locale === "en") return label;
  const exact = EXACT_ES[label];
  if (exact) return exact;
  for (const [pattern, spanish] of PATTERNS_ES) {
    const match = label.match(pattern);
    if (match) return spanish(...match.slice(1));
  }
  return label;
}
