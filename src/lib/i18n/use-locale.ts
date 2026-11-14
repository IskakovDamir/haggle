"use client";

// The visitor's language in the browser. Lives in localStorage, like the case file; no cookie, no login.
import { useEffect, useSyncExternalStore } from "react";
import { DEFAULT_LOCALE, LANGUAGE_TAG, isLocale, type Locale } from "./locale";

const KEY = "haggle:locale";
const EVENT = "haggle:locale";
let memory: Locale | null = null;

function read(): Locale {
  try {
    const stored = window.localStorage.getItem(KEY);
    if (isLocale(stored)) return stored;
  } catch {
    // private mode: fall back to memory
  }
  return memory ?? DEFAULT_LOCALE;
}

export function setLocale(locale: Locale): void {
  memory = locale;
  try {
    window.localStorage.setItem(KEY, locale);
  } catch {
    // private mode: memory keeps it for this page
  }
  document.documentElement.lang = LANGUAGE_TAG[locale];
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** The visitor's language. English during server render and the first client pass. */
export function useLocale(): Locale {
  const locale = useSyncExternalStore(subscribe, read, () => DEFAULT_LOCALE);
  useEffect(() => {
    document.documentElement.lang = LANGUAGE_TAG[locale];
  }, [locale]);
  return locale;
}

/** Remembers a language when a page that is only in that language renders (the "/es" landing). */
export function useRememberLocale(locale: Locale): void {
  useEffect(() => {
    if (read() !== locale) setLocale(locale);
    else document.documentElement.lang = LANGUAGE_TAG[locale];
  }, [locale]);
}
