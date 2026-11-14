"use client";

import { useEffect, useState } from "react";
import type { Capabilities } from "@/lib/types";
import { fetchCapabilities } from "./api";

export type CapabilitiesState =
  | { status: "loading" }
  | { status: "ready"; capabilities: Capabilities }
  | { status: "error"; message: string };

/** GET /api/config once, so a screen can say honestly which parts are switched on. */
export function useCapabilities(): CapabilitiesState {
  const [state, setState] = useState<CapabilitiesState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    void fetchCapabilities().then((result) => {
      if (cancelled) return;
      setState(result.ok ? { status: "ready", capabilities: result.data } : { status: "error", message: result.error });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
