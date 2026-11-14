"use client";

import { useState } from "react";
import { Check, LoaderCircle } from "lucide-react";
import { WIN_FEE_BPS } from "@/lib/engine";
import { formatDate, formatPoints } from "@/lib/format";
import { formatCents } from "@/lib/money";
import { MIN_CHARGE_CENTS } from "@/lib/pay/checkout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/primitives";
import type { CallRecord, Savings } from "@/lib/types";
import { startCheckout } from "@/components/call/api";
import { Notice } from "@/components/call/page-states";
import { useCapabilities } from "@/components/call/use-capabilities";
import { localDateOf } from "@/components/dashboard/dates";
import type { PaymentReturn } from "./use-payment-return";

/** Only a Stripe-hosted https page is a place to send the visitor to pay. */
function isCheckoutUrl(url: string): boolean {
  try {
    return new URL(url).protocol === "https:";
  } catch {
    return false;
  }
}

/** "Pay after your win": the fee, the button to Stripe's test checkout, and an honest state for everything else. */
export function PayPanel({
  call,
  savings,
  label,
  paymentReturn,
}: {
  call: CallRecord;
  savings: Savings;
  /** What the charge is for, as it will read on the checkout page. */
  label: string;
  paymentReturn: PaymentReturn;
}) {
  const capabilities = useCapabilities();
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pay() {
    setOpening(true);
    setError(null);
    const result = await startCheckout({ callId: call.id, annualSavingsCents: savings.annualSavingsCents, label });
    if (result.ok && isCheckoutUrl(result.data.url)) {
      window.location.assign(result.data.url);
      return;
    }
    setOpening(false);
    setError(result.ok ? "The checkout link did not look right, so we did not open it. Nothing was charged." : result.error);
  }

  /** The one thing to show under the heading, in order of what is already settled. */
  function payState() {
    if (call.paid) {
      return (
        <p className="flex items-center gap-2 font-semibold text-green">
          <Check className="size-5 shrink-0" aria-hidden />
          Paid {formatCents(call.paid.amountCents)} on {formatDate(localDateOf(call.paid.at))}. Thank you.
        </p>
      );
    }
    if (savings.feeCents < MIN_CHARGE_CENTS) {
      return <p>The fee on this win is under {formatCents(MIN_CHARGE_CENTS)}, so there is nothing to pay.</p>;
    }
    if (paymentReturn.status === "checking") {
      return (
        <p role="status" className="flex items-center gap-2">
          <LoaderCircle className="size-4 shrink-0 animate-spin text-green" aria-hidden />
          Checking your payment with Stripe.
        </p>
      );
    }
    if (capabilities.status === "error") return <Notice tone="alarm">{capabilities.message}</Notice>;
    if (capabilities.status === "ready" && !capabilities.capabilities.payments) {
      return <p>Payments are not set up on this server, so there is nothing to pay here.</p>;
    }

    return (
      <>
        {paymentReturn.status === "failed" && <Notice tone="alarm">{paymentReturn.message}</Notice>}
        {error && <Notice tone="alarm">{error}</Notice>}
        <Button size="lg" onClick={pay} disabled={opening || capabilities.status === "loading"} className="w-full sm:w-fit">
          {opening && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
          {opening ? "Opening checkout" : `Pay ${formatCents(savings.feeCents)}`}
        </Button>
        <p className="text-sm text-muted">Test mode. Use card 4242 4242 4242 4242, any future date, any CVC.</p>
      </>
    );
  }

  return (
    <Card className="p-5 sm:p-6">
      <h2 className="text-lg font-extrabold">Pay after your win</h2>
      <p className="mt-1 text-sm text-muted">
        Haggle charges {formatPoints(WIN_FEE_BPS)}% of your first-year savings, and only after the bank says yes.
      </p>
      <div className="mt-4 flex flex-col gap-3">{payState()}</div>
    </Card>
  );
}
