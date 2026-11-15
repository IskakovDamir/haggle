"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { EASE } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/primitives";
import { todayIso } from "@/lib/format";
import type { CardAccount, CaseFile, Extraction } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  cardAlreadyInCase,
  formValuesFrom,
  readCardForm,
  warningsToShow,
  type CardFormField,
  type CardFormValues,
} from "./card-form";
import { Field } from "./field";
import { RevealField, RevealGroup, RevealSequence } from "./field-reveal";
import { SURFACE, SampleTag, StepDot, onColor, type Surface } from "./surfaces";

type FieldSpec = {
  field: CardFormField;
  label: string;
  hint?: string;
  unit?: "dollars" | "percent";
  type?: "date";
  inputMode?: "numeric";
  autoComplete?: string;
  placeholder?: string;
};

/** Every field of the card, in the order a statement is read. */
const GROUPS: { title: string; fields: FieldSpec[] }[] = [
  {
    title: "Who and which card",
    fields: [
      { field: "holderFirstName", label: "Cardholder's first name", autoComplete: "given-name" },
      { field: "issuerName", label: "Bank", placeholder: "Chase" },
      { field: "cardName", label: "Card name", hint: "optional" },
      { field: "last4", label: "Last four digits", hint: "optional", inputMode: "numeric" },
    ],
  },
  {
    title: "The debt",
    fields: [
      { field: "balance", label: "Statement balance", unit: "dollars" },
      { field: "purchaseApr", label: "Purchase APR", unit: "percent" },
      { field: "creditLimit", label: "Credit limit", hint: "optional", unit: "dollars" },
      { field: "minimumPayment", label: "Minimum payment due", hint: "optional", unit: "dollars" },
      { field: "interestCharged", label: "Interest charged this period", hint: "optional", unit: "dollars" },
    ],
  },
  {
    title: "Fees",
    fields: [
      { field: "annualFee", label: "Annual fee", hint: "blank if none", unit: "dollars" },
      { field: "lateFee", label: "Late fee on this statement", hint: "blank if none", unit: "dollars" },
    ],
  },
  {
    title: "Other rates",
    fields: [
      { field: "penaltyApr", label: "Penalty APR", hint: "optional", unit: "percent" },
      { field: "promoApr", label: "Promo APR", hint: "if one is running", unit: "percent" },
      { field: "promoEndsOn", label: "Promo ends on", type: "date" },
    ],
  },
  {
    title: "Dates and history",
    fields: [
      { field: "statementDate", label: "Statement date", hint: "optional", type: "date" },
      { field: "dueDate", label: "Payment due date", hint: "optional", type: "date" },
      { field: "memberSinceYear", label: "Member since", hint: "year, optional", inputMode: "numeric" },
      { field: "latePaymentsLast12m", label: "Late payments in the last 12 months", hint: "optional", inputMode: "numeric" },
    ],
  },
];

/** The fill of each group card, top to bottom, as in the design. */
const GROUP_SURFACES: Surface[] = ["white", "blue", "white", "ink", "wash"];

const FIELD_ORDER = GROUPS.flatMap((group) => group.fields.map((spec) => spec.field));
const inputId = (field: CardFormField) => `card-${field}`;

const TITLE: Record<Extraction["source"], React.ReactNode> = {
  upload: (
    <>
      Check what we <em>read</em>
    </>
  ),
  sample: (
    <>
      Check what we <em>read</em>
    </>
  ),
  manual: (
    <>
      Check your <em>numbers</em>
    </>
  ),
};

const LEAD: Record<Extraction["source"], string> = {
  upload: "Compare these with your statement and fix anything that is off.",
  sample: "This statement belongs to a made-up person. It was read the same way an upload is. Change any number to see what happens.",
  manual: "Add anything else the statement shows. Blank fields are fine.",
};

/**
 * The confirm screen: every field of the card that was read, editable, with warnings next to the
 * fields they are about. Nothing is saved from here until the visitor presses "Looks right".
 */
export function ConfirmForm({
  extraction,
  caseFile,
  onConfirm,
  onStartOver,
  position,
  startOverLabel = "Start over",
}: {
  extraction: Extraction;
  /** The case this card will join, if there is one. */
  caseFile: CaseFile | null;
  onConfirm: (card: CardAccount, holderFirstName: string) => void;
  onStartOver: () => void;
  /** "Statement 2 of 3", when several statements are confirmed in turn. */
  position?: string;
  startOverLabel?: string;
}) {
  const [today] = useState(todayIso);
  const [values, setValues] = useState<CardFormValues>(() => formValuesFrom(extraction, caseFile?.holderFirstName));
  const [edited, setEdited] = useState<ReadonlySet<CardFormField>>(new Set());
  /** Errors appear once the visitor has left a field, or has tried to continue. */
  const [visited, setVisited] = useState<ReadonlySet<CardFormField>>(new Set());
  const [triedToContinue, setTriedToContinue] = useState(false);

  const typed = readCardForm(values, extraction.card, today);
  const warnings = warningsToShow(extraction, typed.card, edited);
  const warningCount = warnings.general.length + Object.values(warnings.byField).flat().length;
  const errorFor = (field: CardFormField) => (triedToContinue || visited.has(field) ? typed.errors[field] : undefined);
  const updates = typed.card ? cardAlreadyInCase(caseFile, typed.card) : null;

  function change(field: CardFormField, text: string) {
    setValues((current) => ({ ...current, [field]: text }));
    setEdited((current) => new Set(current).add(field));
  }

  function looksRight() {
    if (typed.card) return onConfirm(typed.card, typed.holderFirstName);
    setTriedToContinue(true);
    const firstBad = FIELD_ORDER.find((field) => typed.errors[field]);
    if (firstBad) document.getElementById(inputId(firstBad))?.focus();
  }

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        looksRight();
      }}
    >
      <RevealSequence gap={0.06} className="relative">
        {/* A magnifying glass beside the title, on screens wide enough to leave it clear of the words. */}
        <motion.div
          aria-hidden
          initial={{ opacity: 0, y: 16, rotate: -8 }}
          animate={{ opacity: 1, y: 0, rotate: 0 }}
          transition={{ duration: 0.8, ease: EASE, delay: 0.15 }}
          className="pointer-events-none absolute top-2 right-10 hidden w-[190px] xl:block"
        >
          <Image src="/app/3d/magnifier-lens-3d.png" alt="" width={190} height={204} priority className="h-auto w-full" />
        </motion.div>
        <RevealGroup className="flex flex-wrap items-center gap-2">
          {position && <Badge tone="lime">{position}</Badge>}
          {extraction.source === "sample" && <SampleTag />}
          <AnimatePresence initial={false}>
            {warningCount > 0 && (
              <motion.span
                key="to-check"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.25, ease: EASE }}
              >
                <Badge tone="leak">{warningCount === 1 ? "1 thing to check" : `${warningCount} things to check`}</Badge>
              </motion.span>
            )}
          </AnimatePresence>
        </RevealGroup>
        <RevealGroup>
          <h1 className="mt-4 text-[clamp(32px,4.5vw,48px)] leading-[1.1] font-semibold tracking-[-0.035em] text-hg-ink">
            {TITLE[extraction.source]}
          </h1>
        </RevealGroup>
        <RevealGroup>
          <p className="mt-4 max-w-2xl text-[18px] leading-7 font-medium tracking-[-0.01em] text-muted">
            {LEAD[extraction.source]} Nothing is saved or calculated until you press Looks right.
          </p>
        </RevealGroup>

        <AnimatePresence initial={false}>
          {warnings.general.length > 0 && (
            <motion.div
              key="general-warnings"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: EASE }}
              className="overflow-hidden"
            >
              <ul className="mt-6 space-y-1 rounded-[20px] border border-leak/30 bg-leak-soft p-4 text-sm text-leak">
                {warnings.general.map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-8 space-y-4">
          {GROUPS.map((group, index) => {
            const surface = GROUP_SURFACES[index % GROUP_SURFACES.length];
            const dark = onColor(surface);
            return (
              <RevealGroup key={group.title}>
                <div className={cn(SURFACE[surface], "rounded-[28px] p-5 sm:p-7")}>
                  <h2
                    className={cn(
                      "flex items-center gap-2.5 text-[13px] font-semibold tracking-[-0.002em]",
                      dark ? "text-white/70" : "text-hg-ink-2",
                    )}
                  >
                    <StepDot n={index + 1} surface={surface} size="s" />
                    {group.title}
                  </h2>
                  <div className="mt-5 grid gap-x-4 gap-y-5 sm:grid-cols-2">
                    {group.fields.map(({ field, ...spec }) => (
                      <RevealField key={field}>
                        <Field
                          id={inputId(field)}
                          name={field}
                          value={values[field]}
                          onChange={(event) => change(field, event.target.value)}
                          onBlur={() => setVisited((current) => new Set(current).add(field))}
                          error={errorFor(field)}
                          warnings={warnings.byField[field]}
                          onColor={dark}
                          {...spec}
                        />
                      </RevealField>
                    ))}
                  </div>
                </div>
              </RevealGroup>
            );
          })}
        </div>

        <RevealGroup className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button type="submit" size="lg">
            Looks right
            <ArrowRight className="size-4" aria-hidden />
          </Button>
          <Button variant="ghost" size="lg" onClick={onStartOver}>
            {startOverLabel}
          </Button>
        </RevealGroup>
      </RevealSequence>
      <div className="mt-3 space-y-1 text-sm text-muted" aria-live="polite">
        {triedToContinue && !typed.card && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: EASE }}
            className="text-alarm"
          >
            Fix the fields marked in red first.
          </motion.p>
        )}
        {updates && (
          <p>
            This updates the {updates.issuerName} card{updates.last4 ? ` ending in ${updates.last4}` : ""} that is already in
            your plan.
          </p>
        )}
        <p>Your numbers stay in this browser. There is no account and no bank login.</p>
      </div>
    </form>
  );
}
