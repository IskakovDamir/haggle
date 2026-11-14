// Read helpers for the benchmark dataset, plus the one place that turns a stat into display text.
import { formatDollarsCompact, formatShort } from "@/lib/money";
import { formatApr, formatPercent, formatPoints, formatSeconds } from "@/lib/format";
import { BANKS, DATASET_AS_OF, MARKET_STATS, MISSED_PAYMENT_TIMELINE, TOPICS } from "./data";
import type { Bank, BankMetric, Stat, Topic } from "./types";

export { BANKS, DATASET_AS_OF, MISSED_PAYMENT_TIMELINE, TOPICS };
export type * from "./types";

export function getBank(slug: string): Bank | undefined {
  return BANKS.find((bank) => bank.slug === slug);
}

export function getMarketStats(): Stat[] {
  return MARKET_STATS;
}

export function getMarketStat(id: string): Stat {
  const stat = MARKET_STATS.find((s) => s.id === id);
  if (!stat) throw new Error(`Unknown market stat: ${id}`);
  return stat;
}

export function getTopic(slug: string): Topic | undefined {
  return TOPICS.find((topic) => topic.slug === slug);
}

/** Every stat in the dataset, market and bank, for the image route and the tests. */
export function allStats(): Stat[] {
  return [...MARKET_STATS, ...BANKS.flatMap((bank) => [...Object.values(bank.stats), ...bank.extraStats])];
}

export function getStat(id: string): Stat | undefined {
  return allStats().find((s) => s.id === id);
}

/** Banks sorted by one metric, highest first. */
export function banksBy(metric: BankMetric): Bank[] {
  return [...BANKS].sort((a, b) => b.stats[metric].value - a.stats[metric].value);
}

/** The number as people read it: "84%", "6.3 pts", "$40", "4 min", "643". */
export function formatStatValue(stat: Pick<Stat, "value" | "unit">): string {
  switch (stat.unit) {
    case "cents":
      return stat.value >= 100_000_000 ? formatDollarsCompact(stat.value) : formatShort(stat.value);
    case "share_bps":
      return formatPercent(stat.value);
    case "apr_bps":
      return formatApr(stat.value);
    case "points_bps":
      return `${formatPoints(stat.value)} pts`;
    case "seconds":
      return formatSeconds(stat.value);
    case "score":
      return stat.value.toLocaleString("en-US");
  }
}

/** Source names in Spanish. Names of companies, sites and regulations stay as they are. */
const SOURCE_NAMES_ES: Record<string, string> = {
  "LendingTree survey, via KKTV": "Encuesta de LendingTree, vía KKTV",
  "LendingTree survey, via FOX 5 NY": "Encuesta de LendingTree, vía FOX 5 NY",
  "Federal Reserve G.19": "Reserva Federal, G.19",
  "Federal Reserve Bank of New York": "Banco de la Reserva Federal de Nueva York",
  "J.D. Power 2025, via Clark.com": "J.D. Power 2025, vía Clark.com",
  "CFPB, 2024 penalty fees rule": "CFPB, regla de cargos por penalización de 2024",
};

export function sourceName(name: string, language: "en" | "es" = "en"): string {
  return language === "es" ? (SOURCE_NAMES_ES[name] ?? name) : name;
}

/** Plain-text provenance for places with no link, such as JSON-LD and image alt text. */
export function provenanceText(stat: Stat, language: "en" | "es" = "en"): string {
  if (language === "es") {
    if (stat.kind === "estimate") return "Estimación";
    if (stat.kind === "measured") return "Medido por Haggle";
    return `Fuente: ${sourceName(stat.source?.name ?? "desconocida", "es")}`;
  }
  if (stat.kind === "estimate") return "Estimate";
  if (stat.kind === "measured") return "Measured by Haggle";
  return `Source: ${stat.source?.name ?? "unknown"}`;
}
