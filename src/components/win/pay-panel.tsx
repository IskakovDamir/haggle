"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, LoaderCircle } from "lucide-react";
import { EASE } from "@/components/motion/reveal";
import { WIN_FEE_BPS } from "@/lib/engine";
import { formatDate, formatPoints } from "@/lib/format";
import type { Copy } from "@/lib/i18n/locale";
import { useLocale } from "@/lib/i18n/use-locale";
import { formatCents } from "@/lib/money";
import { MIN_CHARGE_CENTS } from "@/lib/pay/checkout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/primitives";
import type { CallRecord, Savings } from "@/lib/types";
import { startCheckout } from "@/components/call/api";
import { Notice } from "@/components/call/page-states";
import { useCapabilities } from "@/components/call/use-capabilities";
import { localDateOf } from "@/components/dashboard/dates";
import { paymentFailureMessage, type PaymentReturn } from "./use-payment-return";
import { BEAT } from "./win-motion";

type PayCopy = {
  title: string;
  lead: (pct: string) => string;
  paid: (amount: string, date: string) => string;
  underMinimum: (min: string) => string;
  checking: string;
  noPayments: string;
  badLink: string;
  opening: string;
  pay: (fee: string) => string;
  testMode: string;
};

const COPY: Copy<PayCopy> = {
  en: {
    title: "Pay after your win",
    lead: (pct) => `Haggle charges ${pct}% of your first-year savings, and only after the bank says yes.`,
    paid: (amount, date) => `Paid ${amount} on ${date}. Thank you.`,
    underMinimum: (min) => `The fee on this win is under ${min}, so there is nothing to pay.`,
    checking: "Checking your payment with Stripe.",
    noPayments: "Payments are not set up on this server, so there is nothing to pay here.",
    badLink: "The checkout link did not look right, so we did not open it. Nothing was charged.",
    opening: "Opening checkout",
    pay: (fee) => `Pay ${fee}`,
    testMode: "Test mode. Use card 4242 4242 4242 4242, any future date, any CVC.",
  },
  es: {
    title: "Paga después de ganar",
    lead: (pct) => `Haggle cobra el ${pct}% de lo que ahorras el primer año, y solo después de que el banco dice que sí.`,
    paid: (amount, date) => `Pagaste ${amount} el ${date}. Gracias.`,
    underMinimum: (min) => `El cargo por esta victoria es menor de ${min}, así que no hay nada que pagar.`,
    checking: "Revisando tu pago con Stripe.",
    noPayments: "Los pagos no están configurados en este servidor, así que aquí no hay nada que pagar.",
    badLink: "El enlace de pago no se veía bien, así que no lo abrimos. No se cobró nada.",
    opening: "Abriendo el pago",
    pay: (fee) => `Pagar ${fee}`,
    testMode: "Modo de prueba. Usa la tarjeta 4242 4242 4242 4242, cualquier fecha futura y cualquier CVC.",
  },
};

/** Marks the error we raise ourselves when the checkout link is not https. */
const BAD_LINK = "bad-link";

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
  const locale = useLocale();
  const copy = COPY[locale];
  const [opening, setOpening] = useState(false);
  // "bad-link" is our own sentence, said in the visitor's language; other errors come from the server as they are.
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
    setError(result.ok ? BAD_LINK : result.error);
  }

  /** The one thing to show under the heading, in order of what is already settled. */
  function payState() {
    if (call.paid) {
      return (
        <p className="flex items-center gap-3 rounded-2xl bg-hg-blue-soft px-4 py-3 font-semibold text-green">
          <motion.span
            aria-hidden
            className="flex size-7 shrink-0 items-center justify-center rounded-full bg-hg-blue text-white"
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            // Usually lands after the Stripe check, so it pops a beat after it mounts, not on the page's clock.
            transition={{ type: "spring", stiffness: 420, damping: 20, delay: 0.25 }}
          >
            <Check className="size-4" strokeWidth={3} />
          </motion.span>
          {copy.paid(formatCents(call.paid.amountCents), formatDate(localDateOf(call.paid.at)))}
        </p>
      );
    }
    if (savings.feeCents < MIN_CHARGE_CENTS) {
      return <p>{copy.underMinimum(formatCents(MIN_CHARGE_CENTS))}</p>;
    }
    if (paymentReturn.status === "checking") {
      return (
        <p role="status" className="flex items-center gap-2">
          <LoaderCircle className="size-4 shrink-0 animate-spin text-hg-blue" aria-hidden />
          {copy.checking}
        </p>
      );
    }
    if (capabilities.status === "error") return <Notice tone="alarm">{capabilities.message}</Notice>;
    if (capabilities.status === "ready" && !capabilities.capabilities.payments) {
      return <p>{copy.noPayments}</p>;
    }

    return (
      <>
        {paymentReturn.status === "failed" && <Notice tone="alarm">{paymentFailureMessage(paymentReturn, locale)}</Notice>}
        {error && <Notice tone="alarm">{error === BAD_LINK ? copy.badLink : error}</Notice>}
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: EASE, delay: BEAT.pay + 0.2 }}
          className="w-full sm:w-fit"
        >
          <Button size="lg" onClick={pay} disabled={opening || capabilities.status === "loading"} className="w-full sm:w-fit">
            {opening && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
            {opening ? copy.opening : copy.pay(formatCents(savings.feeCents))}
          </Button>
        </motion.div>
        <p className="text-sm text-muted">{copy.testMode}</p>
      </>
    );
  }

  return (
    <Card className="rounded-[28px] p-6 sm:p-7">
      <h2 className="text-[20px] leading-tight font-semibold tracking-[-0.03em] text-hg-ink">{copy.title}</h2>
      <p className="mt-1.5 text-sm text-muted">{copy.lead(formatPoints(WIN_FEE_BPS))}</p>
      <div className="mt-5 flex flex-col gap-3">{payState()}</div>
    </Card>
  );
}
