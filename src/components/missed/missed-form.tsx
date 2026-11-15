"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import { callHref } from "@/components/call/resolve-call";
import { EASE, Stagger, StaggerItem } from "@/components/motion/reveal";
import { Field } from "@/components/start/field";
import { SURFACE, SampleTag, StepDot } from "@/components/start/surfaces";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/primitives";
import { feeForWin, leversFor } from "@/lib/engine";
import { formatApr } from "@/lib/format";
import type { Locale } from "@/lib/i18n/locale";
import { useLocale } from "@/lib/i18n/use-locale";
import { MISSED_REASONS, MAX_NOTE_CHARS } from "@/lib/missed";
import { formatCents, formatDollars } from "@/lib/money";
import { newCase, useCaseFile, withCard } from "@/lib/store";
import type { CardAccount } from "@/lib/types";
import { cn } from "@/lib/utils";
import { MISSED_COPY, localizeMissedError, reasonLabelFor } from "./missed-copy";
import { BLANK_MISSED, SAMPLE_MISSED, SAMPLE_MISSED_CARD_ID, readMissedForm, type MissedField, type MissedValues } from "./missed-model";

const newId = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `id-${Date.now()}`);

/** The missed-payment way in: a few numbers, the true reason, then straight to the call. */
export function MissedForm() {
  const router = useRouter();
  const locale = useLocale();
  const copy = MISSED_COPY[locale];
  const { update } = useCaseFile();
  const [values, setValues] = useState<MissedValues>(BLANK_MISSED);
  const [sample, setSample] = useState(false);
  const [tried, setTried] = useState(false);

  const thisYear = new Date().getFullYear();
  // The preview needs no real id; the card gets one when it is saved.
  const result = useMemo(() => readMissedForm(values, { id: "draft", thisYear }), [values, thisYear]);
  const errors: Partial<Record<MissedField, string>> = {};
  if (!result.ok) {
    for (const [field, message] of Object.entries(result.errors) as [MissedField, string][]) {
      errors[field] = localizeMissedError(message, locale);
    }
  }

  // What the call is worth, from the engine, as soon as the numbers are good enough to read.
  const lever = result.ok ? leversFor(result.card).find((candidate) => candidate.kind === "missed_payment") : undefined;
  const worth = lever?.eligible ? lever.potentialAnnualCents : null;

  const set = <K extends keyof MissedValues>(field: K, value: MissedValues[K]) => {
    setValues((current) => ({ ...current, [field]: value }));
  };
  const bind = (field: MissedField) => ({
    id: `missed-${field}`,
    name: field,
    value: values[field] ?? "",
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => set(field, event.target.value as never),
    error: tried ? errors[field] : undefined,
  });

  function fillSample() {
    setValues(SAMPLE_MISSED);
    setSample(true);
    setTried(false);
  }

  function submit() {
    if (!result.ok) {
      setTried(true);
      const first = (Object.keys(result.errors) as MissedField[])[0];
      document.getElementById(first === "reason" ? "missed-reason" : `missed-${first}`)?.focus();
      return;
    }
    const saved = readMissedForm(values, { id: sample ? SAMPLE_MISSED_CARD_ID : newId(), thisYear });
    if (!saved.ok) return;
    const { card, holderFirstName } = saved;
    update((current) => {
      const name = holderFirstName || current?.holderFirstName || "";
      // The form has no card-name field: keep the name a saved copy of this card already has.
      const known = current?.cards.find((candidate) => candidate.id === card.id);
      const merged = known && card.cardName === "Credit card" ? { ...card, cardName: known.cardName } : card;
      return current ? { ...withCard(current, merged), holderFirstName: name } : newCase(name, merged);
    });
    router.push(callHref(`${card.id}:missed_payment`));
  }

  const asks = result.ok ? asksFor(result.card, locale) : [];

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <Stagger onMount gap={0.08} className="flex flex-col gap-5">
          <StaggerItem className="flex flex-wrap items-center gap-3">
            <Button type="button" variant="outline" size="sm" onClick={fillSample} data-tour="fill-sample">
              <Sparkles className="size-3.5" aria-hidden />
              {copy.fillSample}
            </Button>
            {sample && <SampleTag>{copy.sampleData}</SampleTag>}
          </StaggerItem>

          <StaggerItem>
            <Section>
              <SectionTitle n={1} title={copy.reasonTitle} lead={copy.reasonLead} />
              <div id="missed-reason" tabIndex={-1} role="radiogroup" aria-label={copy.reasonGroup} className="mt-4 flex flex-wrap gap-2 outline-none">
                {MISSED_REASONS.map((reason) => {
                  const on = values.reason === reason.id;
                  return (
                    <button
                      key={reason.id}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      onClick={() => set("reason", reason.id)}
                      className={cn(
                        "relative rounded-full border px-4 py-2 text-sm font-semibold transition-colors duration-200",
                        on ? "border-hg-blue text-white" : "border-hg-line bg-white text-hg-ink-2 hover:border-hg-blue-tint hover:bg-hg-blue-soft",
                      )}
                    >
                      {on && (
                        <motion.span
                          layoutId="missed-reason-pill"
                          className="absolute inset-0 rounded-full bg-hg-blue"
                          transition={{ type: "spring", stiffness: 420, damping: 34 }}
                        />
                      )}
                      <span className="relative">{reasonLabelFor(reason.id, locale)}</span>
                    </button>
                  );
                })}
              </div>
              <AnimatePresence initial={false}>
                {tried && errors.reason && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden pt-2 text-sm text-alarm"
                  >
                    {errors.reason}
                  </motion.p>
                )}
              </AnimatePresence>
              <div className="mt-5">
                <label htmlFor="missed-note" className="mb-1.5 block text-sm font-semibold tracking-[-0.005em] text-hg-ink-2">
                  {copy.noteLabel} <span className="font-medium text-hg-muted">{copy.optional}</span>
                </label>
                <textarea
                  id="missed-note"
                  rows={2}
                  maxLength={MAX_NOTE_CHARS + 20}
                  value={values.note}
                  onChange={(event) => set("note", event.target.value)}
                  aria-invalid={tried && errors.note ? true : undefined}
                  placeholder={copy.notePlaceholder}
                  className="w-full resize-none rounded-[22px] border border-hg-line bg-white px-4 py-3 text-base text-ink transition-[border-color,box-shadow] placeholder:text-muted/70 hover:border-hg-blue-tint focus:border-hg-blue focus:shadow-[0_0_0_4px_rgb(47_107_255/0.12)] focus:outline-none"
                />
                <p className={cn("mt-1 text-xs", tried && errors.note ? "text-alarm" : "text-hg-muted")}>
                  {tried && errors.note ? errors.note : copy.noteCount(values.note.trim().length, MAX_NOTE_CHARS)}
                </p>
              </div>
            </Section>
          </StaggerItem>

          <StaggerItem>
            <Section wash>
              <SectionTitle n={2} title={copy.cardTitle} lead={copy.cardLead} />
              <div className="mt-5 grid gap-x-4 gap-y-5 sm:grid-cols-2">
                <Field label={copy.bank} placeholder="Chase" {...bind("issuerName")} />
                <Field label={copy.firstName} hint={copy.optional} autoComplete="given-name" {...bind("holderFirstName")} />
                <Field label={copy.balance} unit="dollars" placeholder="8,400.00" {...bind("balance")} />
                <Field label={copy.aprNow} unit="percent" placeholder="29.99" {...bind("apr")} />
                <Field label={copy.last4} hint={copy.optional} inputMode="numeric" {...bind("last4")} />
                <Field label={copy.memberSince} hint={copy.memberSinceHint} inputMode="numeric" placeholder="2016" {...bind("memberSinceYear")} />
              </div>
              <Toggle
                className="mt-5"
                label={copy.aprRaised}
                checked={values.aprRaised}
                onChange={(next) => set("aprRaised", next)}
              />
              <AnimatePresence initial={false}>
                {values.aprRaised && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, ease: EASE }}
                    className="overflow-hidden"
                  >
                    <Field className="pt-4 sm:max-w-[calc(50%-8px)]" label={copy.aprBefore} unit="percent" placeholder="27.24" {...bind("aprBefore")} />
                  </motion.div>
                )}
              </AnimatePresence>
            </Section>
          </StaggerItem>

          <StaggerItem>
            <Section>
              <SectionTitle n={3} title={copy.missedTitle} lead={copy.missedLead} />
              <div className="mt-5 grid gap-x-4 gap-y-5 sm:grid-cols-3">
                <Field label={copy.lateFee} hint={copy.optional} unit="dollars" placeholder="40.00" {...bind("lateFee")} />
                <Field label={copy.interest} hint={copy.optional} unit="dollars" {...bind("interestCharged")} />
                <Field label={copy.daysLate} hint={copy.optional} inputMode="numeric" placeholder="9" {...bind("daysLate")} />
              </div>
              <div className="mt-5 flex flex-col gap-3">
                <Toggle label={copy.paidSince} checked={values.paidSince} onChange={(next) => set("paidSince", next)} />
                <Toggle
                  label={copy.firstInYear}
                  checked={values.firstInYear}
                  onChange={(next) => set("firstInYear", next)}
                />
              </div>
            </Section>
          </StaggerItem>

          <StaggerItem className="flex flex-wrap items-center gap-3">
            <Button type="submit" size="lg" data-tour="missed-submit">
              {copy.submit(values.issuerName.trim())}
              <ArrowRight className="size-4" aria-hidden />
            </Button>
            <p className="text-sm text-hg-muted">{copy.practice}</p>
          </StaggerItem>
        </Stagger>
      </form>

      <div className="relative lg:sticky lg:top-24">
        {/* The hourglass stands on the card's top edge, its foot hidden behind it. Wide screens only: it needs the room above. */}
        <motion.div
          aria-hidden
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASE, delay: 0.35 }}
          className="pointer-events-none absolute -top-[210px] right-[58px] hidden w-[170px] xl:block"
        >
          <Image src="/app/3d/hourglass-3d-lg.png" alt="" width={170} height={259} priority className="h-auto w-full" />
        </motion.div>
        <motion.aside
          data-tour="missed-asks"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE, delay: 0.25 }}
          className={cn(SURFACE.ink, "relative overflow-hidden rounded-[28px] p-6")}
          aria-live="polite"
        >
          <p className="text-sm font-semibold text-white/70">{copy.asksTitle}</p>
          {asks.length > 0 ? (
            <ul className="mt-4 flex flex-col gap-2.5">
              <AnimatePresence initial={false}>
                {asks.map((ask) => (
                  <motion.li
                    key={ask}
                    layout
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 8 }}
                    transition={{ duration: 0.3, ease: EASE }}
                    className="flex items-start gap-2.5 text-[15px] leading-snug font-medium"
                  >
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-white/25">
                      <Check className="size-3" aria-hidden />
                    </span>
                    {ask}
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          ) : (
            <p className="mt-4 text-[15px] leading-snug text-white/80">{copy.asksEmpty}</p>
          )}
          <div className={cn(SURFACE.blue, "mt-6 rounded-[20px] p-4")}>
            <p className="text-sm text-white/70">{copy.worthTitle}</p>
            <p className="mt-1 text-[40px] leading-none font-semibold tracking-[-0.04em] tabular-nums">
              {worth === null ? "—" : formatDollars(worth)}
            </p>
            <p className="mt-2 text-sm text-white/70">
              {worth === null || worth === 0 ? copy.payNothing : copy.payOnWin(formatCents(feeForWin(worth)))}
            </p>
          </div>
        </motion.aside>
      </div>
    </div>
  );
}

/** The asks in plain words, from the card the form built. */
function asksFor(card: CardAccount, locale: Locale): string[] {
  const copy = MISSED_COPY[locale];
  const asks: string[] = [];
  if (card.lateFeeCents > 0) asks.push(copy.askLateFee(formatCents(card.lateFeeCents)));
  const before = card.missedPayment?.aprBeforeBps ?? null;
  if (before !== null && before < card.purchaseAprBps) {
    asks.push(copy.askAprBack(formatApr(before)));
  }
  if (card.interestChargedCents !== null && card.interestChargedCents > 0) {
    asks.push(copy.askInterest(formatCents(card.interestChargedCents)));
  }
  asks.push(copy.askCreditReport);
  return asks;
}

/** A step of the form: a white card inside a frame. The frame is the blue wash for the card's numbers. */
function Section({ wash = false, children }: { wash?: boolean; children: React.ReactNode }) {
  return (
    <div className={cn("rounded-[28px] p-2.5 sm:p-8", wash ? SURFACE.wash : SURFACE.white)}>
      <div className="rounded-[24px] border border-hg-line bg-white p-5 sm:p-7">{children}</div>
    </div>
  );
}

function SectionTitle({ n, title, lead }: { n: number; title: string; lead: string }) {
  return (
    <div className="flex items-start gap-3">
      <StepDot n={n} />
      <div>
        <h2 className="text-lg leading-7 font-semibold tracking-[-0.02em] text-hg-ink">{title}</h2>
        <p className="text-sm text-hg-muted">{lead}</p>
      </div>
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
  className,
}: {
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between gap-4 rounded-2xl bg-hg-surface px-4 py-3", className)}>
      <span className="text-sm font-semibold text-hg-ink-2">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} label={label} />
    </div>
  );
}
