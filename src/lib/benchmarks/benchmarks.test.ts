import { describe, expect, it } from "vitest";
import { BANKS, MISSED_PAYMENT_TIMELINE, TOPICS, datasetSchema, MARKET_STATS } from "./data";
import { allStats, banksBy, formatStatValue, getBank, getMarketStats, getStat, getTopic, provenanceText } from "./index";
import type { BankMetric, StatUnit } from "./types";

const stats = allStats();
const facts = BANKS.flatMap((bank) => [...bank.phoneMenu, ...bank.facts]);

describe("benchmark provenance", () => {
  it("the whole dataset passes its schema", () => {
    expect(() => datasetSchema.parse({ market: MARKET_STATS, timeline: MISSED_PAYMENT_TIMELINE, banks: BANKS })).not.toThrow();
  });

  it("every stat has a kind", () => {
    for (const stat of stats) expect(["measured", "cited", "estimate"]).toContain(stat.kind);
  });

  it("every cited stat, fact and timeline step links to an https source", () => {
    const cited = [...stats.filter((s) => s.kind === "cited"), ...facts, ...MISSED_PAYMENT_TIMELINE];
    expect(cited.length).toBeGreaterThan(0);
    for (const item of cited) {
      expect(item.source?.url, item.id).toMatch(/^https:\/\//);
      expect(item.source?.name, item.id).toBeTruthy();
    }
  });

  it("no estimate carries a source url", () => {
    const estimates = stats.filter((s) => s.kind === "estimate");
    expect(estimates.length).toBeGreaterThan(0);
    for (const stat of estimates) expect(stat.source, stat.id).toBeUndefined();
  });

  it("every value is an integer and every date is ISO", () => {
    for (const stat of stats) {
      expect(Number.isInteger(stat.value), stat.id).toBe(true);
      expect(stat.asOf, stat.id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("the schema rejects a cited stat with no source and an estimate with one", () => {
    const base = { id: "x", label: "x", value: 1, unit: "score", asOf: "2026-01-01" };
    const bad = [
      { ...base, kind: "cited" },
      { ...base, kind: "estimate", source: { name: "x", url: "https://example.com" } },
    ];
    for (const stat of bad) {
      expect(() => datasetSchema.parse({ market: [stat], timeline: [], banks: [] })).toThrow();
    }
  });
});

describe("benchmark ids and slugs", () => {
  it("all stat ids are unique", () => {
    const ids = [...stats.map((s) => s.id), ...facts.map((f) => f.id), ...MISSED_PAYMENT_TIMELINE.map((t) => t.id)];
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("all bank and topic slugs are unique and url-safe", () => {
    const slugs = [...BANKS.map((b) => b.slug), ...TOPICS.map((t) => t.slug)];
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) expect(slug).toMatch(/^[a-z0-9-]+$/);
  });

  it("has the five banks from the research", () => {
    expect(BANKS.map((b) => b.slug)).toEqual(["chase", "capital-one", "citi", "amex", "discover"]);
  });
});

describe("benchmark units", () => {
  const expected: Record<BankMetric, StatUnit> = {
    satisfaction: "score",
    waitToPerson: "seconds",
    lateFeeMax: "cents",
    lateFeeRefundRate: "share_bps",
    typicalAprCut: "points_bps",
  };

  it("each bank metric uses the same unit at every bank", () => {
    for (const bank of BANKS) {
      for (const [metric, unit] of Object.entries(expected)) {
        expect(bank.stats[metric as BankMetric].unit, `${bank.slug} ${metric}`).toBe(unit);
      }
    }
  });

  it("shares stay between 0% and 100%, money and durations are positive", () => {
    for (const stat of stats) {
      if (stat.unit === "share_bps") expect(stat.value).toBeLessThanOrEqual(10_000);
      expect(stat.value, stat.id).toBeGreaterThan(0);
    }
  });

  it("formats each unit the way a reader expects", () => {
    expect(formatStatValue({ value: 8400, unit: "share_bps" })).toBe("84%");
    expect(formatStatValue({ value: 2236, unit: "apr_bps" })).toBe("22.36%");
    expect(formatStatValue({ value: 630, unit: "points_bps" })).toBe("6.3 pts");
    expect(formatStatValue({ value: 4000, unit: "cents" })).toBe("$40");
    expect(formatStatValue({ value: 128_500_000_000_000, unit: "cents" })).toBe("$1.285 trillion");
    expect(formatStatValue({ value: 240, unit: "seconds" })).toBe("4 min");
    expect(formatStatValue({ value: 643, unit: "score" })).toBe("643");
  });
});

describe("benchmark helpers", () => {
  it("finds banks, topics and stats by slug or id", () => {
    expect(getBank("amex")?.name).toBe("American Express");
    expect(getBank("nope")).toBeUndefined();
    expect(getTopic("lower-apr")?.ctaPath).toBe("/start");
    expect(getTopic("missed-payment")?.ctaPath).toBe("/missed");
    expect(getStat("market-apr-ask-success")?.value).toBe(8400);
    expect(getMarketStats().every((s) => s.id.startsWith("market-"))).toBe(true);
  });

  it("sorts banks by a metric, highest first", () => {
    const sorted = banksBy("lateFeeRefundRate").map((b) => b.stats.lateFeeRefundRate.value);
    expect(sorted).toEqual([...sorted].sort((a, b) => b - a));
  });

  it("labels provenance in plain text", () => {
    expect(provenanceText(getStat("chase-apr-cut")!)).toBe("Estimate");
    expect(provenanceText(getStat("market-average-apr")!)).toBe("Source: Federal Reserve G.19");
  });
});

describe("spanish benchmarks", () => {
  it("every stat, fact, timeline step and topic has Spanish text", async () => {
    const { localizeBank, localizeStat, localizedTimeline, localizedTopics } = await import("./locale");
    for (const stat of allStats()) expect(() => localizeStat(stat, "es"), stat.id).not.toThrow();
    for (const bank of BANKS) expect(() => localizeBank(bank, "es"), bank.slug).not.toThrow();
    expect(localizedTimeline("es")).toHaveLength(MISSED_PAYMENT_TIMELINE.length);
    for (const topic of localizedTopics("es")) expect(topic.title).not.toMatch(/credit card/i);
  });

  it("keeps numbers and sources identical across languages", async () => {
    const { localizeStat } = await import("./locale");
    for (const stat of allStats()) {
      const es = localizeStat(stat, "es");
      expect([es.value, es.unit, es.kind, es.source, es.asOf]).toEqual([stat.value, stat.unit, stat.kind, stat.source, stat.asOf]);
    }
  });

  it("builds Spanish paths", async () => {
    const { calculatorPath, insightsBankPath, insightsTopicPath } = await import("./locale");
    expect(insightsBankPath("chase", "es")).toBe("/es/datos/chase");
    expect(insightsTopicPath("missed-payment", "es")).toBe("/es/datos/pago-atrasado");
    expect(insightsTopicPath("lower-apr", "en")).toBe("/insights/lower-apr");
    expect(calculatorPath("es")).toBe("/es/herramientas/calculadora-de-intereses");
  });
});
