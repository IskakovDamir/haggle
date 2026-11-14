"use client";

import { useEffect, useState } from "react";
import type { Copy, Locale } from "@/lib/i18n/locale";
import { useCaseFile, withCall } from "@/lib/store";
import type { CallRecord } from "@/lib/types";
import { verifyCheckout } from "@/components/call/api";

/** Why a payment check failed: our own two findings, or an error the server sent in its own words. */
type FailureReason = "other-call" | "unpaid" | "error";

export type PaymentReturn =
  /** No payment to check: the visitor did not just come back from Stripe, or the call is already paid. */
  | { status: "none" }
  | { status: "checking" }
  | { status: "failed"; reason: FailureReason; message: string };

const FAILURES: Copy<Record<Exclude<FailureReason, "error">, string>> = {
  en: {
    "other-call": "That payment belongs to a different call, so it is not recorded here.",
    unpaid: "Stripe says this payment was not completed. Nothing was charged.",
  },
  es: {
    "other-call": "Ese pago es de otra llamada, así que no se registra aquí.",
    unpaid: "Stripe dice que este pago no se completó. No se cobró nada.",
  },
};

/** The sentence for a failed payment check, in the visitor's language when it is one of ours. */
export function paymentFailureMessage(failure: Extract<PaymentReturn, { status: "failed" }>, locale: Locale): string {
  return failure.reason === "error" ? failure.message : FAILURES[locale][failure.reason];
}

/**
 * When Stripe sends the visitor back with a session id, ask our server whether that session was paid
 * and store the payment on the call. A paid call is never checked again.
 */
export function usePaymentReturn(call: CallRecord, sessionId: string | null): PaymentReturn {
  const { update } = useCaseFile();
  const [failure, setFailure] = useState<{ sessionId: string; reason: FailureReason; message: string } | null>(null);

  const callId = call.id;
  const toCheck = sessionId !== null && call.paid === null ? sessionId : null;

  useEffect(() => {
    if (toCheck === null) return;
    let cancelled = false;
    const fail = (reason: FailureReason, message = "") => setFailure({ sessionId: toCheck, reason, message });

    void verifyCheckout(toCheck).then((result) => {
      if (cancelled) return;
      if (!result.ok) return fail("error", result.error);
      if (result.data.callId !== callId) return fail("other-call");
      if (!result.data.paid) return fail("unpaid");

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
  return failure?.sessionId === toCheck
    ? { status: "failed", reason: failure.reason, message: failure.message }
    : { status: "checking" };
}
