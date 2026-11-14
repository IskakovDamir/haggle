"use client";

// The visitor's case file. Lives in localStorage: no login, no server copy.
import { useCallback, useSyncExternalStore } from "react";
import type { CallRecord, CardAccount, CaseFile } from "@/lib/types";

const KEY = "haggle:v1";
const EVENT = "haggle:store";

let cachedRaw: string | null = null;
let cachedCase: CaseFile | null = null;
/** Used when localStorage is unavailable (private mode): the page still works, it just forgets on reload. */
let memoryRaw: string | null = null;

function readRaw(): string | null {
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return memoryRaw;
  }
}

function isCaseFile(value: unknown): value is CaseFile {
  if (!value || typeof value !== "object") return false;
  const c = value as Partial<CaseFile>;
  return c.version === 1 && typeof c.id === "string" && Array.isArray(c.cards) && Array.isArray(c.calls);
}

/** The stored case, or null. Returns the same object until the stored value changes. */
export function loadCase(): CaseFile | null {
  const raw = readRaw();
  if (raw === cachedRaw) return cachedCase;
  cachedRaw = raw;
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    cachedCase = isCaseFile(parsed) ? parsed : null;
  } catch {
    cachedCase = null;
  }
  return cachedCase;
}

/** Replace the stored case. null clears it. */
export function saveCase(next: CaseFile | null): void {
  const raw = next ? JSON.stringify(next) : null;
  memoryRaw = raw;
  try {
    if (raw === null) window.localStorage.removeItem(KEY);
    else window.localStorage.setItem(KEY, raw);
  } catch {
    // private mode: memoryRaw keeps it for this page
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  window.addEventListener(EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(EVENT, onChange);
  };
}

const noopSubscribe = () => () => undefined;

/**
 * The case file as React state.
 * `ready` is false during server render and the first client pass, so pages can show a skeleton
 * instead of flashing "no case yet".
 */
export function useCaseFile(): {
  caseFile: CaseFile | null;
  ready: boolean;
  update: (change: (current: CaseFile | null) => CaseFile | null) => void;
} {
  const caseFile = useSyncExternalStore(subscribe, loadCase, () => null);
  const ready = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
  const update = useCallback((change: (current: CaseFile | null) => CaseFile | null) => {
    saveCase(change(loadCase()));
  }, []);
  return { caseFile, ready, update };
}

const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `id-${Math.random().toString(36).slice(2)}`;

export function newCase(holderFirstName: string, card: CardAccount): CaseFile {
  return { version: 1, id: newId(), createdAt: new Date().toISOString(), holderFirstName, cards: [card], calls: [] };
}

/** Add a card, or replace the one with the same id. */
export function withCard(current: CaseFile, card: CardAccount): CaseFile {
  const exists = current.cards.some((c) => c.id === card.id);
  return { ...current, cards: exists ? current.cards.map((c) => (c.id === card.id ? card : c)) : [...current.cards, card] };
}

export function withoutCard(current: CaseFile, cardId: string): CaseFile {
  return { ...current, cards: current.cards.filter((c) => c.id !== cardId) };
}

/** Add a call, or replace the one with the same id. */
export function withCall(current: CaseFile, call: CallRecord): CaseFile {
  const exists = current.calls.some((c) => c.id === call.id);
  return { ...current, calls: exists ? current.calls.map((c) => (c.id === call.id ? call : c)) : [...current.calls, call] };
}

export function newCall(input: Pick<CallRecord, "cardId" | "goal" | "mode">): CallRecord {
  return {
    id: newId(),
    ...input,
    startedAt: new Date().toISOString(),
    endedAt: null,
    turns: [],
    outcome: null,
    savings: null,
    paid: null,
  };
}
