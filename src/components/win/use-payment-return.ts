"use client";

import { useEffect, useState } from "react";
import { useCaseFile, withCall } from "@/lib/store";
import type { CallRecord } from "@/lib/types";
import { verifyCheckout } from "@/components/call/api";

export type PaymentReturn =
  /** No payment to check: the visitor did not just come back from Stripe, or the call is already paid. */
  | { status: "none" }
  | { status: "checking" }
  | { status: "failed"; message: string };

/**
 * When Stripe sends the visitor back with a session id, ask our server whether that session was paid
 * and store the payment on the call. A paid call is never checked again.
 */
export function usePaymentReturn(call: CallRecord, sessionId: string | null): PaymentReturn {
  const { update } = useCaseFile();
  const [failure, setFailure] = useState<{ sessionId: string; message: string } | null>(null);

  const callId = call.id;
  const toCheck = sessionId !== null && call.paid === null ? sessionId : null;

  useEffect(() => {
    if (toCheck === null) return;
    let cancelled = false;
    const fail = (message: string) => setFailure({ sessionId: toCheck, message });

    void verifyCheckout(toCheck).then((result) => {
      if (cancelled) return;
      if (!result.ok) return fail(result.error);
      if (result.data.callId !== callId) return fail("That payment belongs to a different call, so it is not recorded here.");
      if (!result.data.paid) return fail("Stripe says this payment was not completed. Nothing was charged.");

      const paid = { amountCents: result.data.amountCents, sessionId: toCheck, at: new Date().toISOString() };
      update((current) => {
        // Read the call from the store at this moment: it may have changed since this effect started.
        const stored = current?.calls.find((candidate) => candidate.id === callId);
        return current && stored ? withCall(current, { ...stored, paid }) : current;
      });
    });

    return () => {
      cancelled = true;
    };
  }, [toCheck, callId, update]);

  if (toCheck === null) return { status: "none" };
  return failure?.sessionId === toCheck ? { status: "failed", message: failure.message } : { status: "checking" };
}
