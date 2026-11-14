"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SAMPLE_STATEMENTS, type SampleStatement } from "@/lib/statement/samples";
import { newCase, useCaseFile, withCard } from "@/lib/store";
import type { CardAccount, Extraction } from "@/lib/types";
import { BATCH_CONCURRENCY, MAX_BATCH, batchFrom, nextToConfirm, positionOf, savedCount, stillReading, withItem, type BatchItem } from "./batch";
import { BatchPanel } from "./batch-panel";
import { cardAlreadyInCase } from "./card-form";
import { ConfirmForm } from "./confirm-form";
import { readStatement, type ReadingJob, type ReadingProgress } from "./read-statement";
import { ReadingPanel } from "./reading-panel";
import { StartSkeleton } from "./start-skeleton";
import { useReadingSwitch } from "./use-reading-switch";
import { WaysIn, type Way } from "./ways-in";

type Stage =
  /** Arrived with ?sample=: waiting to learn whether the server can read before starting. */
  | { name: "linked"; sample: SampleStatement }
  | { name: "choose"; way: Way; problem: string | null }
  | { name: "reading"; job: ReadingJob; progress: ReadingProgress }
  | { name: "confirm"; extraction: Extraction }
  /** Several statements: each is read, then confirmed in turn. */
  | { name: "batch"; items: BatchItem[] };

const labelOf = (job: ReadingJob) => (job.kind === "sample" ? job.sample.label : job.file.name);
const wayOf = (job: ReadingJob): Way => (job.kind === "sample" ? "sample" : "upload");
const WAY_OF_SOURCE: Record<Extraction["source"], Way> = { upload: "upload", sample: "sample", manual: "type" };

/**
 * /start from the first click to the saved card: pick a way in, read the statement, confirm the numbers.
 * The case file is written in exactly one place, `save`, after the visitor presses "Looks right".
 */
export function StartFlow() {
  const router = useRouter();
  const sampleParam = useSearchParams().get("sample");
  const linkedSample = SAMPLE_STATEMENTS.find((sample) => sample.id === sampleParam) ?? null;
  const reading = useReadingSwitch();
  const { caseFile, update } = useCaseFile();
  const [stage, setStage] = useState<Stage>(
    linkedSample ? { name: "linked", sample: linkedSample } : { name: "choose", way: "upload", problem: null },
  );

  /** The reading in flight. A newer one, or Cancel, makes the older one's late answers irrelevant. */
  const inFlight = useRef<AbortController | null>(null);

  const read = useCallback(async (job: ReadingJob) => {
    inFlight.current?.abort();
    const controller = new AbortController();
    inFlight.current = controller;
    const stillWanted = () => inFlight.current === controller;

    const result = await readStatement(
      job,
      (progress) => stillWanted() && setStage({ name: "reading", job, progress }),
      controller.signal,
    );
    if (!stillWanted()) return;
    if (result.ok) setStage({ name: "confirm", extraction: result.extraction });
    else setStage({ name: "choose", way: wayOf(job), problem: result.cancelled ? null : result.message });
  }, []);

  function start(job: ReadingJob) {
    setStage({ name: "reading", job, progress: { phase: "preparing" } });
    void read(job);
  }

  function cancel(backTo: Way) {
    inFlight.current?.abort();
    inFlight.current = null;
    setStage({ name: "choose", way: backTo, problem: null });
  }

  // A link like /start?sample=maria-chase starts reading by itself, once the server says it can read.
  // The ref keeps React's development double-run of effects from sending the statement twice.
  const linkedStarted = useRef(false);
  useEffect(() => {
    if (stage.name !== "linked" || reading !== "on" || linkedStarted.current) return;
    linkedStarted.current = true;
    void read({ kind: "sample", sample: stage.sample });
  }, [stage, reading, read]);

  /** Read several statements, a couple at a time, then confirm them one by one. */
  async function startBatch(jobs: ReadingJob[]) {
    if (jobs.length === 1) return start(jobs[0]);
    if (jobs.length > MAX_BATCH) {
      setStage({ name: "choose", way: wayOf(jobs[0]), problem: `Add up to ${MAX_BATCH} statements at a time.` });
      return;
    }
    inFlight.current?.abort();
    const controller = new AbortController();
    inFlight.current = controller;
    const items = batchFrom(jobs);
    setStage({ name: "batch", items });

    const queue = [...items];
    const worker = async () => {
      for (let item = queue.shift(); item; item = queue.shift()) {
        const current = item;
        const result = await readStatement(current.job, () => undefined, controller.signal);
        if (inFlight.current !== controller) return;
        const change: Partial<BatchItem> = result.ok
          ? { state: "ready", extraction: result.extraction }
          : { state: "failed", message: result.cancelled ? null : result.message };
        setStage((stage) => (stage.name === "batch" ? { ...stage, items: withItem(stage.items, current.key, change) } : stage));
      }
    };
    await Promise.all(Array.from({ length: BATCH_CONCURRENCY }, worker));
  }

  /** Mark one statement of the batch done, and go to the plan once nothing is left to confirm. */
  function settle(items: BatchItem[], key: string, state: "saved" | "skipped") {
    const next = withItem(items, key, { state });
    if (!nextToConfirm(next) && savedCount(next) > 0 && next.every((item) => item.state !== "failed")) {
      router.push("/plan");
      return;
    }
    setStage({ name: "batch", items: next });
  }

  function save(card: CardAccount, holderFirstName: string) {
    saveCard(card, holderFirstName);
    router.push("/plan");
  }

  function saveCard(card: CardAccount, holderFirstName: string) {
    update((existingCase) => {
      // A newer statement for a card that is already in the case replaces it instead of adding a copy.
      const known = cardAlreadyInCase(existingCase, card);
      const saved = known ? { ...card, id: known.id } : card;
      return existingCase ? { ...withCard(existingCase, saved), holderFirstName } : newCase(holderFirstName, saved);
    });
  }

  if (reading === "unknown") return <StartSkeleton />;

  if (stage.name === "linked" && reading === "on") {
    return <ReadingPanel label={stage.sample.label} progress={{ phase: "preparing" }} onCancel={() => cancel("sample")} />;
  }
  if (stage.name === "reading") {
    return <ReadingPanel label={labelOf(stage.job)} progress={stage.progress} onCancel={() => cancel(wayOf(stage.job))} />;
  }
  if (stage.name === "batch") {
    const { items } = stage;
    const next = nextToConfirm(items);
    if (next?.extraction) {
      return (
        <ConfirmForm
          key={next.key}
          extraction={next.extraction}
          caseFile={caseFile}
          position={positionOf(items, next.key)}
          onConfirm={(card, holderFirstName) => {
            saveCard(card, holderFirstName);
            settle(items, next.key, "saved");
          }}
          startOverLabel="Skip this one"
          onStartOver={() => settle(items, next.key, "skipped")}
        />
      );
    }
    return (
      <BatchPanel
        items={items}
        onCancel={() => cancel(wayOf(items[0].job))}
        onDone={!stillReading(items) && savedCount(items) > 0 ? () => router.push("/plan") : undefined}
      />
    );
  }
  if (stage.name === "confirm") {
    const { extraction } = stage;
    return (
      <ConfirmForm
        extraction={extraction}
        caseFile={caseFile}
        onConfirm={save}
        onStartOver={() => setStage({ name: "choose", way: WAY_OF_SOURCE[extraction.source], problem: null })}
      />
    );
  }

  return (
    <WaysIn
      readingOff={reading === "off"}
      startWith={stage.name === "choose" ? stage.way : "sample"}
      problem={stage.name === "choose" ? stage.problem : null}
      onFiles={(files) => void startBatch(files.map((file) => ({ kind: "file", file })))}
      onSample={(sample) => start({ kind: "sample", sample })}
      onAllSamples={() => void startBatch(SAMPLE_STATEMENTS.map((sample) => ({ kind: "sample", sample })))}
      onEntry={(extraction) => setStage({ name: "confirm", extraction })}
    />
  );
}
