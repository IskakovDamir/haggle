"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { extractionFromManual } from "@/lib/statement/manual";
import type { Extraction } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Field } from "./field";
import { SURFACE } from "./surfaces";
import { RevealField, RevealGroup, RevealSequence } from "./field-reveal";
import { dollarsForEditing, percentForEditing, typedDollars, typedPercent, typedText, type Typed } from "./typed-values";

type ManualField = "issuerName" | "balance" | "purchaseApr" | "creditLimit" | "annualFee" | "holderFirstName";
type ManualValues = Record<ManualField, string>;

const BLANK: ManualValues = { issuerName: "", balance: "", purchaseApr: "", creditLimit: "", annualFee: "", holderFirstName: "" };
const FIELDS = Object.keys(BLANK) as ManualField[];

/** What has to be typed before the numbers can be checked. Everything else can wait for the confirm screen. */
const NEEDED: Partial<Record<ManualField, string>> = {
  issuerName: "Type the bank's name.",
  balance: "Type the statement balance.",
  purchaseApr: "Type the purchase APR.",
};

/** Amounts and rates are handed on in one plain spelling ("8,400.00", "27.24"), however they were typed. */
const dollars = (text: string) => spelled(typedDollars(text), dollarsForEditing);
const READ: Record<ManualField, (text: string) => Typed<string>> = {
  issuerName: (text) => typedText(text),
  holderFirstName: (text) => typedText(text, 40),
  balance: dollars,
  creditLimit: dollars,
  annualFee: dollars,
  purchaseApr: (text) => spelled(typedPercent(text), percentForEditing),
};

function spelled(typed: Typed<number>, spell: (amount: number) => string): Typed<string> {
  return typed.kind === "value" ? { kind: "value", value: spell(typed.value) } : typed;
}

/**
 * The way in that needs no upload and no key: three numbers from the statement, more if you have them.
 * They go through the same checks as a statement that was read, then to the same confirm screen.
 */
export function ManualPanel({ onEntry }: { onEntry: (extraction: Extraction) => void }) {
  const [values, setValues] = useState(BLANK);
  const [triedToContinue, setTriedToContinue] = useState(false);

  const errors: Partial<ManualValues> = {};
  const entry = { ...BLANK };
  for (const field of FIELDS) {
    const typed = READ[field](values[field]);
    if (typed.kind === "value") entry[field] = typed.value;
    else if (typed.kind === "invalid") errors[field] = typed.message;
    else if (NEEDED[field]) errors[field] = NEEDED[field];
  }

  const bind = (field: ManualField) => ({
    id: `manual-${field}`,
    name: field,
    value: values[field],
    onChange: (event: React.ChangeEvent<HTMLInputElement>) =>
      setValues((current) => ({ ...current, [field]: event.target.value })),
    error: triedToContinue ? errors[field] : undefined,
  });

  function check() {
    const firstBad = FIELDS.find((field) => errors[field]);
    if (firstBad) {
      setTriedToContinue(true);
      document.getElementById(`manual-${firstBad}`)?.focus();
      return;
    }
    onEntry(extractionFromManual(entry));
  }

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        check();
      }}
    >
      <RevealSequence>
        <RevealGroup>
          <div className={cn(SURFACE.white, "rounded-[28px] p-5 sm:p-7")}>
            <p className="text-sm font-medium text-muted">
              Three numbers from your statement are enough. The balance is on the first page. The APR is often in the
              interest table on the last one.
            </p>
            <div className="mt-5 grid gap-x-4 gap-y-5 sm:grid-cols-2">
              <RevealField>
                <Field label="Bank" placeholder="Chase" {...bind("issuerName")} />
              </RevealField>
              <RevealField>
                <Field label="Statement balance" unit="dollars" placeholder="8,400.00" {...bind("balance")} />
              </RevealField>
              <RevealField>
                <Field label="Purchase APR" unit="percent" placeholder="27.24" {...bind("purchaseApr")} />
              </RevealField>
              <RevealField>
                <Field label="Credit limit" hint="optional" unit="dollars" {...bind("creditLimit")} />
              </RevealField>
              <RevealField>
                <Field label="Annual fee" hint="optional" unit="dollars" {...bind("annualFee")} />
              </RevealField>
              <RevealField>
                <Field label="Your first name" hint="optional" autoComplete="given-name" {...bind("holderFirstName")} />
              </RevealField>
            </div>
          </div>
        </RevealGroup>
        <RevealGroup>
          <Button type="submit" size="lg" className="mt-5">
            Check the numbers
            <ArrowRight className="size-4" aria-hidden />
          </Button>
        </RevealGroup>
      </RevealSequence>
    </form>
  );
}
