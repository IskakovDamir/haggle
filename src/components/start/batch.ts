// Several statements at once: each one is read, then confirmed in turn. Pure state helpers.
import type { Extraction } from "@/lib/types";
import type { ReadingJob } from "./read-statement";

export type BatchState = "reading" | "ready" | "failed" | "saved" | "skipped";

export type BatchItem = {
  key: string;
  job: ReadingJob;
  label: string;
  state: BatchState;
  extraction: Extraction | null;
  message: string | null;
};

/** At most this many statements are read at the same time. */
export const BATCH_CONCURRENCY = 2;
/** More than this in one go is refused with a sentence: the server limits readings per minute. */
export const MAX_BATCH = 6;

export function batchFrom(jobs: ReadingJob[]): BatchItem[] {
  return jobs.map((job, index) => ({
    key: `${index}-${job.kind === "sample" ? job.sample.id : job.file.name}`,
    job,
    label: job.kind === "sample" ? job.sample.label : job.file.name,
    state: "reading",
    extraction: null,
    message: null,
  }));
}

export function withItem(items: BatchItem[], key: string, change: Partial<BatchItem>): BatchItem[] {
  return items.map((item) => (item.key === key ? { ...item, ...change } : item));
}

/** Still reading at least one statement. */
export function stillReading(items: BatchItem[]): boolean {
  return items.some((item) => item.state === "reading");
}

/** The next statement waiting for the visitor to confirm, once every reading has finished. */
export function nextToConfirm(items: BatchItem[]): BatchItem | null {
  return stillReading(items) ? null : (items.find((item) => item.state === "ready") ?? null);
}

/** "Statement 2 of 3": where this one sits among the statements that were read. */
export function positionOf(items: BatchItem[], key: string): string {
  const readable = items.filter((item) => item.state !== "failed");
  const index = readable.findIndex((item) => item.key === key);
  return `Statement ${index + 1} of ${readable.length}`;
}

export function savedCount(items: BatchItem[]): number {
  return items.filter((item) => item.state === "saved").length;
}
