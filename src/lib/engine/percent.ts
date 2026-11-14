// Percent wording for the engine's sentences. APRs go through formatApr; these cover the two cases it does not.
import { formatPoints } from "@/lib/format";
import type { Bps } from "@/lib/types";

/** A rate in basis points as a short percent: 300 -> "3%", 2500 -> "25%". */
export function percentOf(bps: Bps): string {
  return `${formatPoints(bps)}%`;
}

/** A utilization figure, already rounded to one decimal: 84 -> "84%", 67.2 -> "67.2%". */
export function formatUtilization(pct: number): string {
  return `${pct}%`;
}
