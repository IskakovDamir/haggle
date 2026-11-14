import { describe, expect, it } from "vitest";
import { SAMPLE_STATEMENTS } from "@/lib/statement/samples";
import type { Extraction } from "@/lib/types";
import { batchFrom, nextToConfirm, positionOf, savedCount, stillReading, withItem, type BatchItem } from "./batch";

const jobs = SAMPLE_STATEMENTS.map((sample) => ({ kind: "sample" as const, sample }));
const extraction = {} as Extraction;

describe("batch", () => {
  it("waits for every reading before asking to confirm", () => {
    let items = batchFrom(jobs);
    expect(stillReading(items)).toBe(true);
    items = withItem(items, items[0].key, { state: "ready", extraction });
    expect(nextToConfirm(items)).toBeNull();
    items = withItem(items, items[1].key, { state: "failed", message: "no" });
    items = withItem(items, items[2].key, { state: "ready", extraction });
    expect(nextToConfirm(items)?.key).toBe(items[0].key);
  });

  it("counts positions among the statements that were read", () => {
    let items = batchFrom(jobs);
    items = withItem(items, items[0].key, { state: "ready" });
    items = withItem(items, items[1].key, { state: "failed" });
    items = withItem(items, items[2].key, { state: "ready" });
    expect(positionOf(items, items[2].key)).toBe("Statement 2 of 2");
  });

  it("moves through the batch as statements are saved or skipped", () => {
    let items: BatchItem[] = batchFrom(jobs).map((item) => ({ ...item, state: "ready", extraction }));
    items = withItem(items, items[0].key, { state: "saved" });
    items = withItem(items, items[1].key, { state: "skipped" });
    expect(nextToConfirm(items)?.key).toBe(items[2].key);
    expect(savedCount(items)).toBe(1);
  });
});
